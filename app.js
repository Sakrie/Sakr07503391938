let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = null;
let agents = [];

let selectedAgent = null;
let selectedType = null;
let chartInstance = null;

function signup(){
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;

  if(!u || !p) return alert("املأ الحقول");
  if(users[u]) return alert("المستخدم موجود");

  users[u] = { password: p, agents: [] };
  localStorage.setItem("users", JSON.stringify(users));
  alert("تم إنشاء الحساب");
}

function login(){
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;

  if(!users[u] || users[u].password !== p){
    alert("اسم المستخدم أو كلمة المرور خطأ");
    return;
  }

  currentUser = u;
  agents = users[u].agents || [];

  document.getElementById("authBox").style.display = "none";
  document.getElementById("appBox").style.display = "block";

  render();
}

function logout(){
  location.reload();
}

function save(){
  users[currentUser].agents = agents;
  localStorage.setItem("users", JSON.stringify(users));
}

function addAgent(){
  const n = document.getElementById("name").value.trim();
  const t = document.getElementById("type").value;

  if(!n) return;

  agents.push({
    name: n,
    type: t,
    cards: 0,
    money: 0,
    tips: 0,
    debt: 0,
    history: []
  });

  document.getElementById("name").value = "";
  save();
  render();
}

function openModal(i){
  selectedAgent = i;
  selectedType = null;
  document.getElementById("modalTitle").innerText = "عملية لـ " + agents[i].name;
  document.getElementById("valueInput").value = "";
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal(){
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("valueInput").value = "";
  selectedType = null;
}

function chooseType(t){
  selectedType = t;
}

function saveTransaction(){
  const val = Number(document.getElementById("valueInput").value);
  if(!val || val <= 0) return;

  const a = agents[selectedAgent];

  if(selectedType === "cards"){
    const price = a.type === "inside" ? 750 : 1500;
    const money = val * price;
    a.cards += val;
    a.money += money;
    a.history.push({
      cards: val,
      money: money,
      tip: 0,
      debt: 0,
      date: new Date().toISOString(),
      kind: "cards"
    });
  }

  if(selectedType === "money"){
    a.money += val;
    a.history.push({
      cards: 0,
      money: val,
      tip: 0,
      debt: 0,
      date: new Date().toISOString(),
      kind: "money"
    });
  }

  if(selectedType === "tip"){
    a.tips += val;
    a.money += val;
    a.history.push({
      cards: 0,
      money: val,
      tip: val,
      debt: 0,
      date: new Date().toISOString(),
      kind: "tip"
    });
  }

  if(selectedType === "debt"){
    a.debt += val;
    a.history.push({
      cards: 0,
      money: 0,
      tip: 0,
      debt: val,
      date: new Date().toISOString(),
      kind: "debt"
    });
  }

  save();
  render();
  closeModal();
}

function showStatement(i){
  const a = agents[i];
  let t = "كشف " + a.name + "\n\n";

  if(a.history.length === 0){
    alert("لا يوجد سجل");
    return;
  }

  a.history.forEach(h => {
    t += new Date(h.date).toLocaleString("ar-IQ") + "\n";
    if(h.cards) t += "بطاقات: " + h.cards + "\n";
    if(h.money) t += "مبلغ: " + h.money + "\n";
    if(h.tip) t += "إكرامية: " + h.tip + "\n";
    if(h.debt) t += "سلفة: " + h.debt + "\n";
    t += "\n";
  });

  alert(t);
}

function resetAgent(i){
  if(!confirm("تصفير؟")) return;

  agents[i] = {
    ...agents[i],
    cards: 0,
    money: 0,
    tips: 0,
    debt: 0,
    history: []
  };

  save();
  render();
}

function searchAgent(){
  const s = document.getElementById("search").value.toLowerCase();
  document.querySelectorAll("#agents li").forEach(li => {
    li.style.display = li.innerText.toLowerCase().includes(s) ? "block" : "none";
  });
}

function drawChart(inside, outside){
  const ctx = document.getElementById("chart");

  if(chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["داخل", "خارج"],
      datasets: [{
        data: [inside, outside]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function render(){
  const agentsList = document.getElementById("agents");
  agentsList.innerHTML = "";

  let inside = 0;
  let outside = 0;
  let cards = 0;

  agents.forEach((a, i) => {
    cards += a.cards;

    if(a.type === "inside") inside += a.money;
    else outside += a.money;

    agentsList.innerHTML += `
      <li>
        <b>${a.name}</b><br>
        بطاقات: ${a.cards}<br>
        إكراميات: ${a.tips}<br>
        دين: ${a.debt}<br>
        مبلغ: ${a.money}<br><br>

        <button onclick="openModal(${i})">➕</button>
        <button onclick="showStatement(${i})">كشف</button>
        <button onclick="resetAgent(${i})">تصفير</button>
      </li>
    `;
  });

  document.getElementById("insideTotal").innerText = inside;
  document.getElementById("outsideTotal").innerText = outside;
  document.getElementById("cardsTotal").innerText = cards;

  drawChart(inside, outside);
}

function resetAll(){
  if(!confirm("تصفير الكل؟")) return;
  agents = [];
  save();
  render();
}

function generateReport(){
  const m = document.getElementById("monthPicker").value;
  if(!m) return alert("اختر شهر");

  let [y, mo] = m.split("-");
  mo = Number(mo) - 1;
  y = Number(y);

  let html = "<table class='report-table'><thead><tr><th>مندوب</th><th>بطاقات</th><th>إكراميات</th><th>دين</th><th>مبلغ</th></tr></thead><tbody>";

  agents.forEach(a => {
    let c = 0, m2 = 0, t = 0, d2 = 0;

    a.history.forEach(h => {
      const d = new Date(h.date);
      if(d.getFullYear() === y && d.getMonth() === mo){
        c += h.cards || 0;
        m2 += h.money || 0;
        t += h.tip || 0;
        d2 += h.debt || 0;
      }
    });

    html += `<tr><td>${a.name}</td><td>${c}</td><td>${t}</td><td>${d2}</td><td>${m2}</td></tr>`;
  });

  html += "</tbody></table>";
  document.getElementById("reportBox").innerHTML = html;
}

function exportPDF(){
  const data = document.getElementById("reportBox").innerHTML;
  const w = window.open("", "_blank");

  w.document.write(`
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الشهري</title>
      <style>
        body{font-family:Arial;padding:20px}
        table{width:100%;border-collapse:collapse}
        td,th{border:1px solid #000;padding:8px;text-align:center}
        th{background:#1565c0;color:white}
      </style>
    </head>
    <body>
      <h2 style="text-align:center">التقرير الشهري</h2>
      ${data}
    </body>
    </html>
  `);

  w.document.close();
  w.focus();
  w.print();
}