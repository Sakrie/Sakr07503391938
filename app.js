let users = JSON.parse(localStorage.getItem("users")) || {};
let currentUser = null;
let agents = [];

let selectedAgent = null;
let selectedType = null;

const authBox = document.getElementById("authBox");
const appBox = document.getElementById("appBox");
const agentsList = document.getElementById("agentsList");

// تسجيل
function signup(){
let u=username.value.trim();
let p=password.value;
if(!u||!p) return alert("املأ الحقول");
if(users[u]) return alert("المستخدم موجود");
users[u]={password:p,agents:[]};
localStorage.setItem("users",JSON.stringify(users));
alert("تم");
}

function login(){
let u=username.value.trim();
let p=password.value;
if(!users[u]||users[u].password!==p) return alert("خطأ");
currentUser=u;
agents=users[u].agents||[];
authBox.style.display="none";
appBox.style.display="block";
render();
}

function logout(){location.reload();}

function save(){
users[currentUser].agents=agents;
localStorage.setItem("users",JSON.stringify(users));
}

// إضافة مندوب
function addAgent(){
let n=name.value.trim();
let t=type.value;
if(!n) return;
agents.push({name:n,type:t,cards:0,money:0,tips:0,debt:0,history:[]});
name.value="";
save();
render();
}

// مودال
function openModal(i){
selectedAgent=i;
modalTitle.innerText="عملية لـ "+agents[i].name;
modal.classList.remove("hidden");
}
function closeModal(){
modal.classList.add("hidden");
valueInput.value="";
}
function chooseType(t){selectedType=t;}

// عمليات
function saveTransaction(){
let val=Number(valueInput.value);
if(!val) return;
let a=agents[selectedAgent];

if(selectedType==="cards"){a.cards+=val;a.history.push({cards:val,money:0,tip:0,debt:0,date:Date.now()});}
if(selectedType==="money"){a.money+=val;a.history.push({cards:0,money:val,tip:0,debt:0,date:Date.now()});}
if(selectedType==="tip"){a.tips+=val;a.money+=val;a.history.push({cards:0,money:val,tip:val,debt:0,date:Date.now()});}
if(selectedType==="debt"){a.debt+=val;a.history.push({cards:0,money:0,tip:0,debt:val,date:Date.now()});}

save();
render();
closeModal();
}

// عرض
function render(){
agentsList.innerHTML="";
let inside=0,outside=0,cards=0;

agents.forEach((a,i)=>{
cards+=a.cards;
if(a.type==="inside") inside+=a.money;
else outside+=a.money;

agentsList.innerHTML+=`
<li>
<b>${a.name}</b><br>
بطاقات:${a.cards}<br>
إكراميات:${a.tips}<br>
دين:${a.debt}<br>
مبلغ:${a.money}<br>
<button onclick="openModal(${i})">➕</button>
<button onclick="showStatement(${i})">كشف</button>
<button onclick="resetAgent(${i})">تصفير</button>
</li>`;
});

insideTotal.innerText=inside;
outsideTotal.innerText=outside;
cardsTotal.innerText=cards;
}

// كشف
function showStatement(i){
let a=agents[i];
let t="كشف "+a.name+"\n\n";
a.history.forEach(h=>{
t+=new Date(h.date).toLocaleString()+"\n";
if(h.cards) t+="بطاقات:"+h.cards+"\n";
if(h.money) t+="مبلغ:"+h.money+"\n";
if(h.tip) t+="إكرامية:"+h.tip+"\n";
if(h.debt) t+="دين:"+h.debt+"\n\n";
});
alert(t);
}

// تصفير
function resetAgent(i){
if(!confirm("تصفير؟")) return;
agents[i]={...agents[i],cards:0,money:0,tips:0,debt:0,history:[]};
save();render();
}

function resetAll(){
if(!confirm("تصفير الكل؟")) return;
agents=[];save();render();
}

// بحث
function searchAgent(){
let s=search.value.toLowerCase();
document.querySelectorAll("#agentsList li").forEach(li=>{
li.style.display=li.innerText.toLowerCase().includes(s)?"block":"none";
});
}

// التقرير النهائي
function generateReport(){

let from=new Date(fromDate.value).setHours(0,0,0,0);
let to=new Date(toDate.value).setHours(23,59,59,999);

let insideHTML="",outsideHTML="";
let insideTotal=0,outsideTotal=0;
let insideCards=0,outsideCards=0;

let bestName="";
let bestMoney=0;

agents.forEach(a=>{
let total=0,c=0,t=0,d=0;

a.history.forEach(h=>{
let dt=new Date(h.date).getTime();
if(dt>=from && dt<=to){
total+=h.money||0;
c+=h.cards||0;
t+=h.tip||0;
d+=h.debt||0;
}
});

if(total>bestMoney){bestMoney=total;bestName=a.name;}

if(total===0 && c===0) return;

let row=`<tr><td>${a.name}</td><td>${c}</td><td>${t}</td><td>${d}</td><td>${total}</td></tr>`;

if(a.type==="inside"){
insideHTML+=row;
insideTotal+=total;
insideCards+=c;
}else{
outsideHTML+=row;
outsideTotal+=total;
outsideCards+=c;
}
});

reportBox.innerHTML=`
<h2>🏆 أفضل مندوب: ${bestName} (${bestMoney})</h2>

<h2>داخل</h2>
<table class="report-table">
<tr><th>مندوب</th><th>بطاقات</th><th>إكرامية</th><th>دين</th><th>مبلغ</th></tr>
${insideHTML}
</table>
<p>مجموع البطاقات: ${insideCards}</p>
<p>مجموع الأموال: ${insideTotal}</p>

<h2>خارج</h2>
<table class="report-table">
<tr><th>مندوب</th><th>بطاقات</th><th>إكرامية</th><th>دين</th><th>مبلغ</th></tr>
${outsideHTML}
</table>
<p>مجموع البطاقات: ${outsideCards}</p>
<p>مجموع الأموال: ${outsideTotal}</p>

<canvas id="chart"></canvas>
`;

drawChart(insideTotal,outsideTotal);
}

// رسم
function drawChart(i,o){
new Chart(document.getElementById("chart"),{
type:"bar",
data:{
labels:["داخل","خارج"],
datasets:[{data:[i,o]}]
}
});
}

// PDF
function exportPDF(){
let w=window.open("");
w.document.write(`<html dir="rtl"><body>${reportBox.innerHTML}</body></html>`);
w.print();
}