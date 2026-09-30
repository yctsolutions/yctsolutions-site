/* YCT Solutions · engineering tools (drive sizing, Common DC simulator, V/f game) */
(function(){
  var $=function(id){return document.getElementById(id);};
  var fmt=function(n,d){return Number(n).toLocaleString('ko-KR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});};

  /* ---------- tabs ---------- */
  var tabs=[].slice.call(document.querySelectorAll('#tools [role=tab]'));
  function select(t,focus){
    tabs.forEach(function(b){
      var on=b===t;
      b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;
      $(b.getAttribute('aria-controls')).hidden=!on;
    });
    if(focus)t.focus();
    try{history.replaceState(null,'','#'+t.id.replace('t-','tool-'));}catch(e){}
  }
  tabs.forEach(function(b,i){
    b.addEventListener('click',function(){select(b);});
    b.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        e.preventDefault();
        select(tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length],true);
      }
    });
  });
  var h=location.hash.replace('#tool-','t-');
  if($(h)&&tabs.indexOf($(h))>-1){select($(h));setTimeout(function(){$('tools').scrollIntoView();},50);}

  /* ================= 01 · drive sizing ================= */
  var KW=[0.25,0.37,0.55,0.75,1.1,1.5,2.2,3,4,5.5,7.5,11,15,18.5,22,30,37,45,55,75,90,110,132,160,200,250,315,355,400,450,500,
    560,630,710,800,900,1000,1100,1200,1400,1600,1800,2000,2250,2500,2800,3150,3550,4000,4500,5000,5600,6000];
  var OL={vt:{f:1.00,t:'110% · 60초 (Normal Overload)'},ct:{f:1.36,t:'150% · 60초 (High Overload)'},hd:{f:1.50,t:'150%+ · 반복 기동 (Heavy Duty)'}};
  function eff(p){return p<5?0.86:p<30?0.91:p<200?0.94:0.96;}
  function pf(p){return p<5?0.80:p<30?0.84:0.87;}
  function motorA(p,v){return p*1000/(Math.sqrt(3)*v*eff(p)*pf(p));}
  function radio(n){var r=document.querySelector('input[name='+n+']:checked');return r?r.value:'';}
  var calcOut='';

  function calc(){
    var p=parseFloat($('c-kw').value)||0, ia=parseFloat($('c-a').value), v=+radio('c-v'), load=radio('c-load');
    var t=parseFloat($('c-t').value), alt=parseFloat($('c-alt').value)||0, cable=parseFloat($('c-cable').value)||0, enc=$('c-enc').value;
    if(isNaN(t))t=40;
    if(p<=0){$('r-kw').innerHTML='–<small>kW 급</small>';$('r-sub').textContent='모터 출력을 입력해 주세요.';return;}
    var im=ia>0?ia:motorA(p,v);
    var dT=t>40?Math.max(0.7,1-0.015*(t-40)):1;
    var dA=alt>1000?Math.max(0.7,1-0.01*(alt-1000)/100):1;
    var req=im*OL[load].f/(dT*dA);
    var pick=null;
    for(var i=0;i<KW.length;i++){ if(KW[i]>=p&&motorA(KW[i],v)>=req*0.98){pick=KW[i];break;} }
    var notes=[];
    if(!pick) notes.push(['w','6,000 kW 초과 구간입니다. 드라이브 병렬 구성 또는 중압 드라이브로 별도 검토가 필요합니다.']);
    if(load==='vt') notes.push(['','펌프·팬 부하는 소비 전력이 속도의 세제곱에 비례합니다. 속도를 20% 낮추면 전력은 약 49% 줄어듭니다.']);
    if(load==='hd') notes.push(['w','크레인·윈치는 하강 시 회생 에너지가 발생합니다. 제동 초퍼와 제동저항, 또는 AFE 회생 구성을 검토하세요.']);
    if(load==='ct') notes.push(['','정토크 부하는 기동 토크 확보가 핵심입니다. 벡터 제어(VVC+/Flux) 모드를 권장합니다.']);
    if(cable>(p<7.5?50:150)) notes.push(['w','모터 케이블이 '+fmt(cable)+' m입니다. 모터 절연 보호를 위해 dU/dt 필터 또는 사인파 필터를 검토하세요.']);
    if(t>50) notes.push(['w','주위 온도 50 °C 초과는 표준 디레이팅 범위를 벗어납니다. 판넬 냉각(쿨러·수냉) 설계가 필요합니다.']);
    if(alt>3000) notes.push(['w','고도 3,000 m 초과 시 절연 협조와 PELV 조건을 별도로 확인해야 합니다.']);
    if(p>=250) notes.push(['','대용량 드라이브는 고조파 대책(12펄스, AFE, 액티브 필터)을 함께 검토하는 것이 좋습니다.']);
    if(p>=500&&v===400) notes.push(['','이 용량에서는 690 V 계통이 전류와 케이블 굵기 측면에서 유리할 수 있습니다.']);
    if(enc==='wall') notes.push(['','단독 설치형은 IP54/IP55 외함 모델로 선정하고, 판넬 없이 벽부착합니다.']);
    if(enc==='marine') notes.push(['','선박·해양 환경은 선급(KR·DNV·ABS 등) 승인 모델과 진동·습도 사양을 확인해야 합니다.']);

    $('r-kw').innerHTML=(pick?fmt(pick,pick<1?2:pick<10?1:0):'6,000+')+'<small>kW 급</small>';
    $('r-sub').textContent=pick?'정격 전류 '+fmt(motorA(pick,v),1)+' A 이상, '+v+' V 드라이브':'병렬 또는 중압 구성 검토 대상';
    $('r-im').textContent=fmt(im,1)+' A'+(ia>0?' (입력값)':' (추정)');
    $('r-req').textContent=fmt(req,1)+' A';
    $('r-ol').textContent=OL[load].t;
    $('r-der').textContent=(dT*dA<1)?'× '+(dT*dA).toFixed(3)+' (온도 '+(dT<1?'−'+Math.round((1-dT)*100)+'%':'없음')+', 고도 '+(dA<1?'−'+Math.round((1-dA)*100)+'%':'없음')+')':'없음';
    $('r-notes').innerHTML=notes.map(function(n){return '<li class="'+n[0]+'">'+n[1]+'</li>';}).join('');

    var loadName={vt:'가변토크 (펌프·팬)',ct:'정토크 (컨베이어·압출기)',hd:'중부하 (크레인·윈치)'}[load];
    var encName=$('c-enc').options[$('c-enc').selectedIndex].text;
    calcOut='[드라이브 사양 검토 요청]\n'+
      '- 모터: '+p+' kW / '+v+' V / '+fmt(im,1)+' A'+(ia>0?'':' (추정)')+'\n'+
      '- 부하: '+loadName+'\n'+
      '- 설치 환경: '+t+' °C, 고도 '+alt+' m, 케이블 '+cable+' m, '+encName+'\n'+
      '- 계산기 1차 추정: '+(pick?pick+' kW 급 (≥ '+fmt(req,1)+' A)':'6,000 kW 초과');
  }
  if($('calc')){
    $('calc').addEventListener('input',calc);
    $('calc').addEventListener('change',calc);
    calc();
    $('c-copy').addEventListener('click',function(){
      var b=this;
      function done(ok){b.textContent=ok?'복사했습니다':'복사 실패';setTimeout(function(){b.textContent='사양 복사';},1600);}
      if(navigator.clipboard)navigator.clipboard.writeText(calcOut).then(function(){done(true);},function(){done(false);});
      else done(false);
    });
    $('c-ask').addEventListener('click',function(){
      var m=$('q-msg'),tp=$('q-topic');
      if(m){m.value=calcOut+'\n\n';if(tp)tp.value='드라이브 선정';$('quote').scrollIntoView({behavior:'smooth'});setTimeout(function(){m.focus();},600);}
      else location.href='mailto:yct@yctsolutions.co.kr?subject='+encodeURIComponent('[견적 문의] 드라이브 선정')+'&body='+encodeURIComponent(calcOut);
    });
  }

  /* ================= 02 · Common DC simulator ================= */
  var dc={soc:70,ang1:0,ang2:0,off:{},flows:{}};
  var BAT_KWH=300,BAT_KW=400,TIME_X=60;
  var F=['grid','afe','bat','dcdc','busL','busR','br','inu1','m1','inu2','m2'];
  function dcCompute(){
    var p1=+$('d-m1').value/100*800, p2=+$('d-m2').value/100*400, lim=+$('d-lim').value;
    var batOn=$('d-bat').checked, regen=$('d-regen').checked;
    var net=p1+p2, pb=0, pg=0, br=0, short=0;
    var maxD=batOn&&dc.soc>5?BAT_KW:0, maxC=batOn&&dc.soc<95?BAT_KW:0;
    if(net>=0){
      if(net>lim){pb=Math.min(net-lim,maxD);pg=net-pb;if(pg>lim){short=pg-lim;pg=lim;}}
      else{pg=net;if(batOn&&dc.soc<60){var c=Math.min(lim-net,150,maxC);pb=-c;pg+=c;}}
    }else{
      var sur=-net, ch=Math.min(sur,maxC);pb=-ch;
      var rem=sur-ch; if(regen)pg=-rem; else br=rem;
    }
    var reuse=(p1>0&&p2<0)?Math.min(p1,-p2):(p1<0&&p2>0)?Math.min(-p1,p2):0;
    return {p1:p1,p2:p2,lim:lim,net:net,pb:pb,pg:pg,br:br,short:short,reuse:reuse,batOn:batOn,regen:regen};
  }
  function kw(n){return (n>0.5?'+':n<-0.5?'−':'')+fmt(Math.abs(Math.round(n)))+' kW';}
  function dcRender(s){
    dc.flows={grid:s.pg,afe:s.pg,bat:s.pb,dcdc:s.pb,busL:s.pg+s.pb,busR:s.pg+s.pb-s.br,br:s.br,inu1:s.p1,m1:s.p1,inu2:s.p2,m2:s.p2};
    F.forEach(function(k){
      var el=$('f-'+k),v=dc.flows[k];
      el.style.opacity=Math.abs(v)<1?0:1;
      el.classList.toggle('rev',v<0||k==='br');
    });
    function lab(id,v){var e=$(id);e.textContent=kw(v);e.classList.toggle('rev',v<-0.5);}
    lab('v-grid',s.pg);lab('v-bat',s.pb);lab('v-m1',s.p1);lab('v-m2',s.p2);
    $('v-br').textContent=s.br>0.5?fmt(Math.round(s.br))+' kW 열손실':'대기';
    $('n-br').classList.toggle('hot',s.br>0.5);
    $('n-afe').classList.toggle('hot',s.short>0.5);
    function out(id,v,txt){var e=$(id);e.textContent=txt;e.classList.toggle('rev',v<0);}
    var m1=+$('d-m1').value,m2=+$('d-m2').value;
    out('o-m1',m1,m1<0?kw(s.p1)+' 회생 (감속)':kw(s.p1)+' 구동');
    out('o-m2',m2,m2<0?kw(s.p2)+' 회생 (하강)':m2>0?kw(s.p2)+' 구동 (권상)':'정지');
    $('o-lim').textContent=fmt(s.lim)+' kW';
    $('k-grid').innerHTML=fmt(Math.round(s.pg))+'<small>kW</small>';
    $('k-grid').parentNode.className='kpi'+(s.pg<-0.5?' good':'');
    $('k-bat').innerHTML=(s.pb>0.5?'+':s.pb<-0.5?'−':'')+fmt(Math.abs(Math.round(s.pb)))+'<small>kW</small>';
    $('k-reuse').innerHTML=fmt(Math.round(s.reuse))+'<small>kW</small>';
    $('k-reuse').parentNode.className='kpi'+(s.reuse>0.5?' good':'');
    $('k-br').innerHTML=fmt(Math.round(s.br))+'<small>kW</small>';
    $('k-br').parentNode.className='kpi'+(s.br>0.5?' bad':'');
    var m=$('d-msg'),w=false,t;
    if(s.short>0.5){w=true;t='<b>공급 부족 '+fmt(Math.round(s.short))+' kW</b> — 계통 한도와 배터리 출력을 모두 넘었습니다. 드라이브 파워 리밋이 동작해 부하를 제한합니다.';}
    else if(s.br>0.5){w=true;t='<b>회생 에너지 '+fmt(Math.round(s.br))+' kW가 제동저항에서 열로 버려지고 있습니다.</b> AFE 계통 회생이나 배터리를 켜면 이 에너지를 살릴 수 있습니다.';}
    else if(s.reuse>0.5){t='<b>공유 DC 버스의 장점:</b> '+(s.p2<0?'M2':'M1')+'의 회생 전력 '+fmt(Math.round(s.reuse))+' kW가 계통을 거치지 않고 DC 버스를 통해 '+(s.p2<0?'M1':'M2')+'으로 바로 공급됩니다.';}
    else if(s.pb>0.5){t='<b>피크 쉐이빙:</b> 계통 한도를 넘는 '+fmt(Math.round(s.pb))+' kW를 배터리가 DC/DC 컨버터를 통해 보조합니다.';}
    else if(s.pb<-0.5&&s.net>=0){t='<b>여유 전력 충전:</b> 계통 한도 안의 남는 용량으로 배터리를 충전합니다.';}
    else if(s.pb<-0.5){t='<b>회생 충전:</b> 모터에서 돌아온 에너지를 배터리에 저장합니다.';}
    else if(s.pg<-0.5){t='<b>계통 회생:</b> AFE가 남는 에너지를 계통으로 되돌려 보냅니다. 다이오드 정류기로는 불가능한 동작입니다.';}
    else if(Math.abs(s.net)<1){t='모든 부하가 정지 상태입니다. 슬라이더나 프리셋으로 운전 조건을 바꿔 보세요.';}
    else t='모든 부하 전력을 AFE가 계통에서 공급합니다.';
    m.className='msg'+(w?' w':'');m.innerHTML=t;
  }
  var dcState=null;
  function dcUpdate(){dcState=dcCompute();dcRender(dcState);}
  if($('dc-svg')){
    ['d-m1','d-m2','d-lim','d-bat','d-regen'].forEach(function(id){$(id).addEventListener('input',dcUpdate);$(id).addEventListener('change',dcUpdate);});
    [].forEach.call(document.querySelectorAll('.presets button'),function(b){
      b.addEventListener('click',function(){
        var p=b.dataset.p.split(',');$('d-m1').value=p[0];$('d-m2').value=p[1];
        if(p[2])dc.soc=+p[2];
        dcUpdate();
      });
    });
    dcUpdate();
  }

  /* ================= 03 · V/f tuning challenge ================= */
  var ROUNDS=[
    {n:600,T:0.6,h:'기본기',d:'정격 V/f 선(파란 점선)을 따라 주파수와 전압을 함께 올려 보세요.'},
    {n:1200,T:0.9,h:'고부하 운전',d:'부하가 무겁습니다. 자속이 부족하면 슬립이 커지고 전류가 치솟습니다.'},
    {n:300,T:1.0,h:'저속 고토크',d:'저속에서는 고정자 저항에서 생기는 전압 강하를 보상해야 합니다. 토크 부스트가 필요합니다.'},
    {n:1440,T:0.5,h:'정격 근처',d:'정격 속도 부근입니다. 과여자(V/f 과다)는 철심 포화로 무부하 전류를 키웁니다.'},
    {n:1800,T:0.4,h:'약계자 영역',d:'정격 이상 속도입니다. 전압은 400 V가 한계이므로 자속을 줄여서 속도를 올려야 합니다.'}
  ];
  var g={st:'idle',r:0,t:0,n:0,score:0,hold:0,trip:0,ang:0,phi:0,I:0,stall:false,last:0};
  var best=0;try{best=+localStorage.getItem('yct-vf-best')||0;}catch(e){}
  function vfModel(f,V,T){
    var phi=0,I=0,nEq=0,stall=false;
    if(f<0.5){I=V/40;}
    else{
      phi=Math.max(0,V-10)/(8*f)/0.975;
      var Tmax=2.5*phi*phi;
      if(T>Tmax||phi<0.05){stall=true;I=Math.min(2.5,0.2+4.5*phi);nEq=0;}
      else{
        var s=0.03*T/(phi*phi);nEq=30*f*(1-s);
        var It=T/phi, Im=0.35*phi*(phi>1?Math.exp(3*(phi-1)):1);
        I=Math.sqrt(It*It+Im*Im);
      }
    }
    return {phi:phi,I:I,nEq:nEq,stall:stall};
  }
  function phiIdeal(f){return f>50?390/(8*f)/0.975:1;}
  function setMeter(id,val,max,cls){
    var m=$(id);m.querySelector('.fill').style.width=Math.min(100,Math.max(0,val/max*100))+'%';
    m.className='meter'+(cls?' '+cls:'');
  }
  function status(t,w){var m=$('vf-msg');m.className='msg'+(w?' w':'');m.innerHTML=t;}
  function vfRound(){
    var R=ROUNDS[g.r];
    g.t=0;g.hold=0;g.trip=0;g.n=0;g.st='play';
    $('vf-f').value=0;$('vf-v').value=0;
    $('vf-round').textContent=(g.r+1)+' / '+ROUNDS.length;
    $('vf-target').innerHTML=fmt(R.n)+' <small>rpm</small>';
    $('vf-load').innerHTML=Math.round(R.T*100)+' <small>%</small>';
    $('vf-h').textContent='ROUND '+(g.r+1)+' · '+R.h;
    $('vf-d').textContent=R.d;
    var tol=Math.max(8,R.n*0.015);
    $('vf-band').style.left=(R.n-tol)/2000*100+'%';$('vf-band').style.width=(2*tol)/2000*100+'%';
    status('목표 <b>'+fmt(R.n)+' rpm</b> ± '+Math.round(tol)+' rpm에서 전류 1.2 pu 이하로 <b>2초</b> 유지하면 클리어입니다.');
    btns('play');vfSync();
  }
  function btns(mode){
    $('vf-start').hidden=mode!=='idle'&&mode!=='end';
    $('vf-start').textContent=mode==='end'?'다시 도전':'게임 시작';
    $('vf-reset').hidden=mode!=='trip';
    $('vf-auto').hidden=mode!=='play';
  }
  function vfSync(){
    $('o-f').textContent=(+$('vf-f').value).toFixed(1)+' Hz';
    $('o-v').textContent=Math.round($('vf-v').value)+' V';
    var f=+$('vf-f').value,V=+$('vf-v').value;
    $('vf-pt').setAttribute('cx',36+f/80*274);$('vf-pt').setAttribute('cy',180-V/450*166);
  }
  function vfTick(ts){
    var dt=g.last?Math.min(0.25,(ts-g.last)/1000):0;g.last=ts;
    var visible=!$('p-vf').hidden&&!document.hidden;
    if(visible&&g.st!=='idle'){
      var R=ROUNDS[g.r],f=+$('vf-f').value,V=+$('vf-v').value;
      var m=g.st==='trip'?{phi:0,I:0,nEq:0,stall:false}:vfModel(f,V,R.T);
      g.phi=m.phi;g.I=m.I;
      g.n+=(m.nEq-g.n)*Math.min(1,dt/0.5);
      if(g.st==='play'){
        g.t+=dt;
        var tol=Math.max(8,R.n*0.015);
        if(m.I>1.5){g.trip+=dt;}else g.trip=Math.max(0,g.trip-dt);
        if(g.trip>0.6){
          g.st='trip';g.score=Math.max(0,g.score-150);btns('trip');
          status('<b>'+(m.stall?'스톨 → 과전류 트립!':'과전류 트립 (OC)!')+'</b> '+(m.stall?'자속이 부족해 부하 토크를 이기지 못했습니다. 전압(V)을 더 주세요.':'V/f 비율이 맞지 않아 전류가 한계를 넘었습니다.')+' −150점. [재기동]을 눌러 다시 시도하세요.',true);
        }else if(Math.abs(g.n-R.n)<=tol&&m.I<=1.2){
          g.hold+=dt;
          if(g.hold>=2){
            var base=Math.max(200,Math.round(1000-25*g.t)),dp=Math.abs(m.phi-phiIdeal(f));
            var bonus=dp<0.05?300:dp<0.1?150:0;
            g.score+=base+bonus;g.st='clear';
            status('<b>클리어!</b> '+g.t.toFixed(1)+'초 · +'+base+'점'+(bonus?' · 자속 보너스 +'+bonus:'')+(g.r<ROUNDS.length-1?' — 다음 라운드로 넘어갑니다.':''));
            setTimeout(function(){
              if(g.r<ROUNDS.length-1){g.r++;vfRound();}
              else{
                g.st='end';var nb=g.score>best;if(nb){best=g.score;try{localStorage.setItem('yct-vf-best',best);}catch(e){}}
                $('vf-best').textContent=fmt(best);
                status('<b>최종 '+fmt(g.score)+'점</b>'+(nb?' — 최고 기록 경신!':' (최고 '+fmt(best)+'점)')+' 실제 드라이브는 이 V/f 곡선과 슬립 보상을 자동으로 계산합니다. 벡터 제어라면 더 정밀하게요.');
                btns('end');
              }
            },1400);
          }
        }else g.hold=Math.max(0,g.hold-dt*2);
        $('vf-time').innerHTML=g.t.toFixed(1)+' <small>s</small>';
      }
      $('vf-score').textContent=fmt(g.score);
      $('vf-hold').style.width=Math.min(100,g.hold/2*100)+'%';
      var tolN=Math.max(8,R.n*0.015);
      setMeter('m-n',g.n,2000,Math.abs(g.n-R.n)<=tolN?'ok':'');
      setMeter('m-i',g.I,2,g.I>1.5?'bad':g.I<=1.2&&g.I>0.05?'ok':'');
      var pi=g.st==='trip'?1:phiIdeal(f);
      setMeter('m-p',g.phi,1.6,g.phi>0&&Math.abs(g.phi-pi)<0.1?'ok':g.phi>1.25?'bad':'');
      $('t-n').textContent=fmt(Math.round(g.n))+' rpm';
      $('t-i').textContent=g.I.toFixed(2)+' pu';
      $('t-p').textContent=g.phi.toFixed(2)+' pu';
      $('vf-rpm').textContent=fmt(Math.round(g.n));
    }
    if(visible){g.ang=(g.ang+g.n*6*dt*0.08)%360;$('vf-rot').setAttribute('transform','rotate('+g.ang.toFixed(1)+' 75 75)');}
    requestAnimationFrame(vfTick);
  }
  if($('p-vf')){
    $('vf-best').textContent=fmt(best);
    ['vf-f','vf-v'].forEach(function(id){$(id).addEventListener('input',vfSync);});
    [].forEach.call(document.querySelectorAll('.fine button'),function(b){
      b.addEventListener('click',function(){
        var s=$(b.dataset.for);s.value=Math.min(+s.max,Math.max(+s.min,+s.value+ +b.dataset.d));vfSync();
      });
    });
    $('vf-start').addEventListener('click',function(){g.r=0;g.score=0;vfRound();});
    $('vf-reset').addEventListener('click',function(){
      $('vf-f').value=0;$('vf-v').value=0;g.n=0;g.trip=0;g.hold=0;g.st='play';btns('play');vfSync();
      status('재기동 준비 완료. 이번엔 V/f 비율에 주의하세요.');
    });
    $('vf-auto').addEventListener('click',function(){
      var f=+$('vf-f').value;$('vf-v').value=Math.round(Math.min(400,10+390*f/50));vfSync();
      if(g.st==='play'){g.score=Math.max(0,g.score-50);$('vf-score').textContent=fmt(g.score);}
    });
    vfSync();btns('idle');
    requestAnimationFrame(vfTick);
  }

  /* ---------- shared animation loop for DC flows & motors ---------- */
  var lastT=0;
  function dcTick(ts){
    var dt=lastT?Math.min(0.25,(ts-lastT)/1000):0;lastT=ts;
    if(dcState&&!$('p-dc').hidden&&!document.hidden){
      // battery SOC (1 s = 1 min)
      if(Math.abs(dcState.pb)>0.5){
        var prev=dc.soc;
        dc.soc=Math.min(100,Math.max(0,dc.soc-dcState.pb*TIME_X*dt/3600/BAT_KWH*100));
        if((prev>5)!==(dc.soc>5)||(prev<95)!==(dc.soc<95)||(prev<60)!==(dc.soc<60))dcUpdate();
      }else if(dcState.batOn&&dc.soc<60&&dcState.net>=0&&dcState.net<dcState.lim)dcUpdate();
      $('dc-soc').textContent='SOC '+dc.soc.toFixed(0)+'%';
      $('dc-socbar').setAttribute('width',(dc.soc/100*90).toFixed(1));
      $('k-soc').innerHTML=dc.soc.toFixed(0)+'<small>%</small>';
      F.forEach(function(k){
        var v=k==='br'?dcState.br:dc.flows[k];
        var sp=Math.sign(v)*Math.min(160,20+Math.abs(v)/5);
        dc.off[k]=((dc.off[k]||0)-sp*dt)%1600;
        $('f-'+k).style.strokeDashoffset=dc.off[k];
      });
      dc.ang1=(dc.ang1+ +$('d-m1').value*4*dt)%360;
      dc.ang2=(dc.ang2+ +$('d-m2').value*4*dt)%360;
      $('m1-rot').setAttribute('transform','rotate('+dc.ang1.toFixed(1)+' 800 90)');
      $('m2-rot').setAttribute('transform','rotate('+dc.ang2.toFixed(1)+' 800 330)');
    }
    requestAnimationFrame(dcTick);
  }
  if($('dc-svg'))requestAnimationFrame(dcTick);
})();
