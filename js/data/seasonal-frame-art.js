const W=600,H=800,GAP=14;
let U=0;
const f=n=>Math.round(n*10)/10;
const SERIF="Georgia,'Times New Roman',serif";
const GOLD='#F2C14E', GOLD_D='#9A6B10';

function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>(s=s*16807%2147483647)/2147483647;}

/* ---------- bố cục 1-4 ảnh ---------- */
function layout(win,n,gap=GAP){
  const{x,y,w,h}=win,R=(a,b,c,d)=>({x:f(a),y:f(b),w:f(c),h:f(d)});
  if(n===1)return[R(x,y,w,h)];
  if(n===2){const hh=(h-gap)/2;return[R(x,y,w,hh),R(x,y+hh+gap,w,hh)];}
  if(n===3){const top=(h-gap)*.56,bot=h-gap-top,ww=(w-gap)/2;return[R(x,y,w,top),R(x,y+top+gap,ww,bot),R(x+ww+gap,y+top+gap,ww,bot)];}
  const ww=(w-gap)/2,hh=(h-gap)/2;
  return[R(x,y,ww,hh),R(x+ww+gap,y,ww,hh),R(x,y+hh+gap,ww,hh),R(x+ww+gap,y+hh+gap,ww,hh)];
}
const mk=(fr,n)=>({win:fr.win,n,slots:layout(fr.win,n)});

/* ---------- helpers ---------- */
const rr=(s,r)=>Math.min(r,s.w/5,s.h/5);
const subRect=(x,y,w,h,r=0)=>`M${x+r} ${y}H${x+w-r}A${r} ${r} 0 0 1 ${x+w} ${y+r}V${y+h-r}A${r} ${r} 0 0 1 ${x+w-r} ${y+h}H${x+r}A${r} ${r} 0 0 1 ${x} ${y+h-r}V${y+r}A${r} ${r} 0 0 1 ${x+r} ${y}Z`;
const clipD=S=>`M0 0H${W}V${H}H0Z `+S.slots.map(s=>subRect(s.x,s.y,s.w,s.h,rr(s,S.win.r))).join(' ');
const base=(S,fill)=>`<defs><mask id="frame-window-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${S.slots.map(s=>`<path d="${subRect(s.x,s.y,s.w,s.h,rr(s,S.win.r))}" fill="#000"/>`).join('')}</mask></defs><rect width="${W}" height="${H}" fill="${fill}" mask="url(#frame-window-mask)"/>`;
const outline=(x,y,w,h,r,c,sw=3,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${c}" stroke-width="${sw}" ${extra}/>`;
const lines=(S,c,sw=3,extra='')=>S.slots.map(s=>outline(s.x,s.y,s.w,s.h,rr(s,S.win.r),c,sw,extra)).join('');

function perim(x,y,w,h,t){
  const L=2*(w+h);let d=(((t%1)+1)%1)*L;
  if(d<w)return{x:x+d,y:y,nx:0,ny:1};
  d-=w;if(d<h)return{x:x+w,y:y+d,nx:-1,ny:0};
  d-=h;if(d<w)return{x:x+w-d,y:y+h,nx:0,ny:-1};
  d-=w;return{x:x,y:y+h-d,nx:1,ny:0};
}

const flake=(x,y,s=1,c='#fff',o=1)=>`<g transform="translate(${f(x)} ${f(y)}) scale(${s})" stroke="${c}" stroke-width="2" stroke-linecap="round" fill="none" opacity="${o}"><path d="M0-10V10M-8.7-5L8.7 5M-8.7 5L8.7-5M-3-8L0-5L3-8M-3 8L0 5L3 8"/></g>`;
const star5=(x,y,R,c,rot=0)=>{let p=[];for(let i=0;i<10;i++){const r=i%2?R*.45:R,a=rot*Math.PI/180+i*Math.PI/5-Math.PI/2;p.push(f(x+Math.cos(a)*r)+','+f(y+Math.sin(a)*r));}return`<polygon points="${p.join(' ')}" fill="${c}"/>`;};
const sparkle=(x,y,s,c,o=1)=>`<path transform="translate(${f(x)} ${f(y)})" d="M0 ${-s}Q0 0 ${s} 0Q0 0 0 ${s}Q0 0 ${-s} 0Q0 0 0 ${-s}Z" fill="${c}" opacity="${o}"/>`;
const blossom=(x,y,r,pc,cc,rot=0)=>{
  let g=`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})">`;
  for(let i=0;i<5;i++)g+=`<ellipse cx="0" cy="${f(-r*.58)}" rx="${f(r*.52)}" ry="${f(r*.6)}" fill="${pc}" stroke="rgba(0,0,0,.14)" stroke-width=".8" transform="rotate(${i*72})"/>`;
  g+=`<circle r="${f(r*.26)}" fill="${cc}"/>`;
  for(let i=0;i<5;i++){const a=(i*72+36)*Math.PI/180;g+=`<circle cx="${f(Math.cos(a)*r*.4)}" cy="${f(Math.sin(a)*r*.4)}" r="${f(r*.07)}" fill="${cc}"/>`;}
  return g+'</g>';
};
const holly=(x,y,s,rot)=>`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
  <path d="M0 0C8-16 28-18 40-6C30-2 28 10 16 8C10 14 2 10 0 0Z" fill="#1F7A43" stroke="#0E3E21" stroke-width="1.5" transform="rotate(-24)"/>
  <path d="M0 0C8-16 28-18 40-6C30-2 28 10 16 8C10 14 2 10 0 0Z" fill="#2A9156" stroke="#0E3E21" stroke-width="1.5" transform="rotate(24) scale(1 -1)"/>
  <circle cx="-3" cy="2" r="5.5" fill="#FF4D5E" stroke="#7A0F18" stroke-width="1.4"/><circle cx="5" cy="4" r="5.5" fill="#FF4D5E" stroke="#7A0F18" stroke-width="1.4"/><circle cx="1" cy="-5" r="5.5" fill="#FF4D5E" stroke="#7A0F18" stroke-width="1.4"/>
  <circle cx="-5" cy="0" r="1.6" fill="#fff" opacity=".7"/><circle cx="3" cy="2" r="1.6" fill="#fff" opacity=".7"/><circle cx="-1" cy="-7" r="1.6" fill="#fff" opacity=".7"/></g>`;
const bow=(x,y,s,c,k='#F2C14E',rot=0)=>`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">
  <path d="M-4 6L-30 56L-12 48L-2 64Z" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><path d="M4 6L30 56L12 48L2 64Z" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>
  <path d="M0 0C-30-36-66-22-58 6C-52 26-20 20 0 0Z" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><path d="M0 0C30-36 66-22 58 6C52 26 20 20 0 0Z" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>
  <path d="M-8 2C-30-14-44-8-44 4M8 2C30-14 44-8 44 4" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/>
  <rect x="-10" y="-9" width="20" height="18" rx="6" fill="${k}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/></g>`;
const bauble=(x,y,r,c1,c2,len=40)=>{const id='bb'+(U++);return`<defs><radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
  <line x1="${x}" y1="${y-len}" x2="${x}" y2="${y-r-7}" stroke="#C9B26A" stroke-width="1.6"/>
  <rect x="${x-r*.28}" y="${y-r-8}" width="${f(r*.56)}" height="8" rx="2" fill="#D4AF37"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})"/><ellipse cx="${f(x-r*.38)}" cy="${f(y-r*.4)}" rx="${f(r*.2)}" ry="${f(r*.12)}" fill="#fff" opacity=".55" transform="rotate(-35 ${f(x-r*.38)} ${f(y-r*.4)})"/>`;};
const bulb=(x,y,c,big=true)=>{const r=big?9:5.5;return`<circle cx="${f(x)}" cy="${f(y)}" r="${r*2}" fill="${c}" opacity=".2"/><rect x="${f(x-r*.45)}" y="${f(y-r-4)}" width="${f(r*.9)}" height="5" rx="1.5" fill="#2A2D3A"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${r*.82}" ry="${r}" fill="${c}"/><ellipse cx="${f(x-r*.3)}" cy="${f(y-r*.35)}" rx="${f(r*.2)}" ry="${f(r*.32)}" fill="#fff" opacity=".6"/>`;};
const coin=(x,y,r,bg)=>`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#E5B93C" stroke="${GOLD_D}" stroke-width="1.6"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r*.78)}" fill="none" stroke="${GOLD_D}" stroke-width="1"/><rect x="${f(x-r*.26)}" y="${f(y-r*.26)}" width="${f(r*.52)}" height="${f(r*.52)}" fill="${bg}" stroke="${GOLD_D}" stroke-width="1"/>`;
const tree=(x,by,h,w,c)=>{let o='';for(let k=0;k<3;k++){const ap=by-h+k*h*.26,bs=by-h*.58+k*h*.24,hw=w*(.34+k*.19);o+=`<path d="M${f(x)} ${f(ap)}L${f(x+hw)} ${f(bs)}L${f(x-hw)} ${f(bs)}Z" fill="${c}"/>`;}return o+`<rect x="${f(x-w*.05)}" y="${f(by-h*.12)}" width="${f(w*.1)}" height="${f(h*.12)}" fill="#3A2418"/>`;};
const burst=(cx,cy,R,c,n=14)=>{let o=`<g stroke="${c}" stroke-linecap="round" fill="${c}"><circle cx="${cx}" cy="${cy}" r="${R}" opacity=".08" stroke="none"/><circle cx="${cx}" cy="${cy}" r="${f(R*.12)}" opacity=".5" stroke="none"/>`;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=a+Math.PI/n;
    o+=`<line x1="${f(cx+Math.cos(a)*R*.3)}" y1="${f(cy+Math.sin(a)*R*.3)}" x2="${f(cx+Math.cos(a)*R*.88)}" y2="${f(cy+Math.sin(a)*R*.88)}" stroke-width="3"/><circle cx="${f(cx+Math.cos(a)*R)}" cy="${f(cy+Math.sin(a)*R)}" r="3.4" stroke="none"/><circle cx="${f(cx+Math.cos(b)*R*.64)}" cy="${f(cy+Math.sin(b)*R*.64)}" r="2.2" stroke="none"/>`;}
  return o+'</g>';};

/* cành mai / đào: gốc ở góc dưới trái, mọc lên */
function sprig(o){
  let s=`<path d="M-10 810C50 700 78 590 66 510S40 400 96 330" stroke="${o.bark}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M66 510C100 490 130 470 150 430M60 600C30 590 10 570 0 540M80 400C120 390 150 360 160 320M70 560C95 575 120 570 140 590" stroke="${o.bark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if(o.leaves)[[100,500,40],[30,590,200],[124,352,-30],[50,470,150],[132,560,20],[150,400,-20]].forEach(([x,y,a])=>s+=`<ellipse cx="${x}" cy="${y}" rx="12" ry="5" fill="#3F8F4F" transform="rotate(${a} ${x} ${y})"/>`);
  [[88,445],[20,500],[152,360],[58,350],[150,470]].forEach(([x,y])=>s+=`<circle cx="${x}" cy="${y}" r="4.5" fill="${o.petal}" stroke="rgba(0,0,0,.15)"/>`);
  [[66,520,1.15],[150,432,.95],[96,330,1.05],[162,322,.85],[2,540,.9],[140,590,.85],[112,468,.75],[40,430,.8],[120,380,.75]].forEach(([x,y,k],i)=>s+=blossom(x,y,18*k,o.petal,o.center,i*23));
  return s;
}

/* ---------- 20 chủ đề: fn(S) với S = {win, n, slots} ---------- */
const F=[];
const add=(id,group,name,desc,win,fn)=>F.push({id,group,name,desc,win:{x:win[0],y:win[1],w:win[2],h:win[3],r:win[4]},fn});

/* ===== Giáng Sinh ===== */
add('noel-01-co-dien','noel','Cổ điển đỏ xanh','Viền đỏ may chỉ trắng, nhành ô rô ở bốn góc',[36,36,528,670,14],S=>{
  let s=base(S,'#B3202A');
  s+=outline(17,17,566,766,10,'#fff',3,'stroke-dasharray="1 9" stroke-linecap="round"');
  s+=lines(S,'#E8C468',3);
  [[36,36,-135],[564,36,-45],[564,706,45],[36,706,135]].forEach(([x,y,r])=>s+=holly(x,y,1.1,r));
  s+=`<text x="300" y="765" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="40" fill="#fff">Merry Christmas</text>`;
  s+=star5(120,752,9,'#E8C468')+star5(480,752,9,'#E8C468');
  return s;
});

add('noel-02-tuyet-roi','noel','Tuyết rơi đêm xanh','Nền xanh đêm, bông tuyết và đụn tuyết dưới đáy',[30,30,540,640,22],S=>{
  const r=rng(7);
  let s=`<defs><linearGradient id="sn-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1B3D"/><stop offset="1" stop-color="#1B3A74"/></linearGradient></defs>`;
  s+=base(S,'url(#sn-g)');
  for(let i=0,n=0;i<400&&n<28;i++){const x=r()*W,y=r()*690;if(x>34&&x<566&&y>34&&y<666)continue;s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(1+r()*1.6)}" fill="#fff" opacity="${f(.4+r()*.5)}"/>`;n++;}
  for(let i=0,n=0;i<400&&n<30;i++){const x=r()*W,y=r()*690;if(x>40&&x<560&&y>40&&y<660)continue;s+=flake(x,y,.5+r()*.9,'#fff',.7+r()*.3);n++;}
  for(let i=0;i<8;i++)s+=flake(40+r()*520,40+r()*620,.4+r()*.5,'#fff',.55);
  s+=`<path d="M0 724C90 692 170 750 290 718S510 692 600 726V800H0Z" fill="#DCE8FA"/><path d="M0 762C110 732 210 784 320 754S520 738 600 764V800H0Z" fill="#fff"/>`;
  return s;
});

add('noel-03-gay-keo','noel','Gậy kẹo đỏ trắng','Viền sọc gậy kẹo, nơ xanh lá ở hai góc',[46,46,508,708,8],S=>{
  let s=`<defs><pattern id="cc-p" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="22" height="44" fill="#fff"/><rect x="22" width="22" height="44" fill="#D3202F"/></pattern></defs>`;
  s+=base(S,'url(#cc-p)');
  s+=outline(1.5,1.5,597,797,0,'#8F1019',3)+lines(S,'#8F1019',3);
  s+=bow(52,52,.9,'#1F7A43','#F2C14E',-45)+bow(548,748,.9,'#1F7A43','#F2C14E',135);
  return s;
});

add('noel-04-vong-nguyet-que','noel','Vòng nguyệt quế','Vòng lá thông, quả đỏ, nơ lớn ở giữa phía trên',[40,40,520,720,40],S=>{
  const r=rng(11);
  let s=base(S,'#17472A');
  const cols=['#1F6B3A','#2C8A4B','#0F3A21','#3AA05B'];
  for(let i=0;i<150;i++){const p=perim(20,20,560,760,i/150),o=(r()-.5)*18,cx=p.x+p.nx*o,cy=p.y+p.ny*o;
    s+=`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(15+r()*6)}" ry="${f(6+r()*3)}" fill="${cols[i%4]}" stroke="rgba(0,0,0,.2)" transform="rotate(${f(r()*360)} ${f(cx)} ${f(cy)})"/>`;}
  for(let i=0;i<26;i++){const p=perim(20,20,560,760,(i+.5)/26);
    [[0,0],[7,5],[-6,6]].forEach(([dx,dy])=>s+=`<circle cx="${f(p.x+dx)}" cy="${f(p.y+dy)}" r="5.5" fill="#D7263D" stroke="#8A1020" stroke-width="1.2"/><circle cx="${f(p.x+dx-1.6)}" cy="${f(p.y+dy-1.8)}" r="1.5" fill="#fff" opacity=".7"/>`);}
  s+=bow(300,18,1.5,'#C8102E','#F2C14E');
  return s;
});

add('noel-05-den-day','noel','Đèn dây lấp lánh','Dây đèn đủ màu vắt phía trên, chạy dọc hai bên',[30,78,540,692,16],S=>{
  const cols=['#FF4D4D','#FFC93C','#4DD0A0','#4DA3FF','#FF7AD9'];
  let s=base(S,'#14161F'),wire='M0 24',k=0,bl='';
  for(let i=0;i<5;i++){const x0=i*120,x1=x0+120,cx=x0+60,cy=84,y0=24;wire+=`Q${cx} ${cy} ${x1} ${y0}`;
    for(let j=1;j<=3;j++){const t=j/4,bx=(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*x1,by=(1-t)*(1-t)*y0+2*(1-t)*t*cy+t*t*y0;bl+=bulb(bx,by+12,cols[k++%5]);}}
  s+=`<path d="${wire}" stroke="#3A3F52" stroke-width="2.5" fill="none"/>`+bl;
  s+=`<path d="M15 100V780M585 100V780M30 785H570" stroke="#3A3F52" stroke-width="2" fill="none"/>`;
  for(let y=118,i=0;y<780;y+=52,i++){s+=bulb(15,y,cols[i%5],false)+bulb(585,y,cols[(i+2)%5],false);}
  for(let x=70,i=0;x<560;x+=52,i++)s+=bulb(x,785,cols[(i+1)%5],false);
  return s;
});

add('noel-06-polaroid','noel','Polaroid Giáng Sinh','Ảnh lấy liền viền kem, băng keo đỏ và dòng chữ viết tay',[40,40,520,590,2],S=>{
  let s=base(S,'#FBF7F0');
  s+=outline(.75,.75,598.5,798.5,6,'#DDD3C2',1.5)+lines(S,'#E4DCCD',2);
  s+=`<rect x="-14" y="28" width="118" height="30" fill="#C1121F" opacity=".78" transform="rotate(-38 45 43)"/><rect x="496" y="28" width="118" height="30" fill="#1F7A43" opacity=".78" transform="rotate(38 555 43)"/>`;
  s+=`<text x="300" y="712" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="54" fill="#A61B26">Merry Christmas</text>`;
  s+=`<text x="300" y="758" text-anchor="middle" font-family="${SERIF}" font-size="22" fill="#6B5B4B">Giáng Sinh 2026</text>`;
  s+=holly(510,742,1.2,-150)+star5(80,744,11,'#D4AF37')+sparkle(112,722,7,'#D4AF37');
  return s;
});

add('noel-07-ong-gia-noel','noel','Ông già Noel','Viền đỏ lót lông trắng, thắt lưng đen và khóa vàng',[40,40,520,640,0],S=>{
  let s=base(S,'#C1121F');
  s+=`<rect x="0" y="702" width="600" height="62" fill="#15151A"/><path d="M0 712H600M0 754H600" stroke="#3A3A44" stroke-width="2" stroke-dasharray="6 6" fill="none"/>`;
  s+=`<text x="140" y="741" text-anchor="middle" font-family="${SERIF}" font-weight="bold" font-style="italic" font-size="26" fill="${GOLD}">Ho Ho Ho</text><text x="460" y="741" text-anchor="middle" font-family="${SERIF}" font-weight="bold" font-style="italic" font-size="26" fill="${GOLD}">Ho Ho Ho</text>`;
  S.slots.forEach(sl=>{const N=Math.max(8,Math.round(2*(sl.w+sl.h)/29));for(let i=0;i<N;i++){const p=perim(sl.x,sl.y,sl.w,sl.h,i/N);s+=`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="17" fill="#fff" stroke="#D5DEEA" stroke-width="2"/>`;}});
  s+=`<rect x="248" y="692" width="104" height="82" rx="8" fill="#E5B93C" stroke="${GOLD_D}" stroke-width="3"/><rect x="268" y="710" width="64" height="46" rx="4" fill="#15151A"/><rect x="274" y="716" width="52" height="34" rx="3" fill="none" stroke="${GOLD}" stroke-width="1.5"/>`;
  return s;
});

add('noel-08-cay-thong-dem','noel','Rừng thông đêm','Hàng cây thông lấp lánh đèn dưới đáy, sao trên viền',[32,32,536,630,18],S=>{
  const r=rng(21);
  let s=`<defs><linearGradient id="pn-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06201B"/><stop offset="1" stop-color="#0F3B31"/></linearGradient></defs>`;
  s+=base(S,'url(#pn-g)');
  for(let i=0,n=0;i<300&&n<16;i++){const x=r()*W,y=r()*640;if(x>38&&x<562&&y>38)continue;s+=sparkle(x,y,4+r()*5,'#F2C14E',.9);n++;}
  for(let i=0;i<10;i++){const x=i*66+8+r()*20,h=130+r()*30;s+=tree(x,806,h,72,'#0B2F27');if(i%3==1)s+=star5(x,806-h-3,9,GOLD);}
  const lc=['#FF5A5F','#FFD23F','#6EE7B7','#7DB8FF'];
  for(let i=0;i<8;i++){const x=42+i*78+r()*12,h=95+r()*25;s+=tree(x,806,h,62,'#14574A');
    for(let j=0;j<5;j++){const yy=806-h*(.2+r()*.7),hw=28*(1-(806-yy)/h)+14;s+=`<circle cx="${f(x+(r()-.5)*hw*2)}" cy="${f(yy)}" r="3" fill="${lc[(i+j)%4]}"/>`;}}
  s+=`<path d="M0 786C100 776 220 796 330 784S520 776 600 788V800H0Z" fill="#EAF2F8"/>`;
  return s;
});

add('noel-09-banh-gung','noel','Bánh gừng','Viền bánh quy nâu, đường kẻ trắng, kẹo gumdrop và người bánh gừng',[40,40,520,660,12],S=>{
  const r=rng(31);
  let s=base(S,'#8A4B24');
  for(let i=0;i<60;i++){const x=r()*W,y=r()*H;if(x>40&&x<560&&y>40&&y<700)continue;s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.5+r()*1.5)}" fill="#5E2F12" opacity=".45"/>`;}
  s+=lines(S,'#5E2F12',3);
  let d='';const N=800;for(let i=0;i<=N;i++){const p=perim(20,20,560,760,i/N),a=Math.sin(i*.6)*5;d+=(i?'L':'M')+f(p.x+p.nx*a)+' '+f(p.y+p.ny*a);}
  s+=`<path d="${d}" fill="none" stroke="#FFF8EE" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const gc=['#E63946','#2A9D5C','#FFC93C','#F78FB3'];
  [[20,20],[580,20],[20,780],[580,780],[300,20],[20,400],[580,400],[170,20],[430,20],[20,210],[580,210],[20,590],[580,590]].forEach(([x,y],i)=>{const c=gc[i%4];s+=`<path d="M${x-13} ${y+10}Q${x-13} ${y-14} ${x} ${y-14}Q${x+13} ${y-14} ${x+13} ${y+10}Z" fill="${c}" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/><path d="M${x-9} ${y-4}Q${x-6} ${y-10} ${x} ${y-10}" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/><circle cx="${x-5}" cy="${y+3}" r="1.2" fill="#fff"/><circle cx="${x+4}" cy="${y}" r="1.2" fill="#fff"/><circle cx="${x+1}" cy="${y+6}" r="1.2" fill="#fff"/>`;});
  const gb='#D08A47',st='stroke="#5E2F12" stroke-width="2"';
  s+=`<rect x="262" y="738" width="28" height="12" rx="6" transform="rotate(-25 276 744)" fill="${gb}" ${st}/><rect x="310" y="738" width="28" height="12" rx="6" transform="rotate(25 324 744)" fill="${gb}" ${st}/><rect x="283" y="758" width="14" height="30" rx="6" fill="${gb}" ${st}/><rect x="303" y="758" width="14" height="30" rx="6" fill="${gb}" ${st}/><rect x="280" y="734" width="40" height="36" rx="14" fill="${gb}" ${st}/><circle cx="300" cy="720" r="15" fill="${gb}" ${st}/><circle cx="295" cy="717" r="1.8" fill="#3A1D0B"/><circle cx="305" cy="717" r="1.8" fill="#3A1D0B"/><path d="M294 724Q300 729 306 724" stroke="#FFF8EE" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="300" cy="745" r="2.6" fill="#E63946"/><circle cx="300" cy="755" r="2.6" fill="#2A9D5C"/>`;
  return s;
});

add('noel-10-vang-sang-trong','noel','Đen vàng quả châu','Viền đen khung vàng, quả châu treo và dòng chữ Merry & Bright',[34,34,532,690,6],S=>{
  let s=base(S,'#0D0D10');
  s+=outline(22,22,556,756,0,'#D4AF37',1.5)+lines(S,'#D4AF37',2);
  [[22,22],[578,22],[22,778],[578,778]].forEach(([x,y])=>s+=`<rect x="${x-6}" y="${y-6}" width="12" height="12" fill="#D4AF37" transform="rotate(45 ${x} ${y})"/>`);
  s+=bauble(120,104,24,'#F6E3A1','#B8902B',80)+bauble(300,136,30,'#E0556B','#6E0F20',112)+bauble(480,100,22,'#FFF4D2','#C9A96A',76)+bauble(205,78,14,'#F6E3A1','#B8902B',52)+bauble(395,86,16,'#F6E3A1','#B8902B',58);
  s+=`<text x="300" y="774" text-anchor="middle" font-family="${SERIF}" font-size="30" letter-spacing="6" fill="#D4AF37">Merry &amp; Bright</text>`;
  [[60,760,8],[540,760,8],[22,380,6],[578,380,6],[22,600,5],[578,200,5]].forEach(([x,y,z])=>s+=sparkle(x,y,z,'#F6E3A1'));
  return s;
});

/* ===== Tết Nguyên Đán ===== */
add('tet-01-hoa-mai','tet','Hoa mai vàng','Nền đỏ viền vàng, hai cành mai chéo góc',[34,34,532,692,14],S=>{
  let s=base(S,'#B0121B');
  s+=lines(S,GOLD,3)+outline(14,14,572,772,8,GOLD,1.5);
  const sp=sprig({bark:'#3E2412',petal:'#FFD21F',center:'#E8920A',leaves:false});
  s+=`<g>${sp}</g><g transform="translate(600 800) rotate(180)">${sp}</g>`;
  s+=`<text x="310" y="776" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="34" fill="${GOLD}">Chúc Mừng Năm Mới</text>`;
  return s;
});

add('tet-02-hoa-dao','tet','Hoa đào hồng','Viền hồng phấn, cành đào có lá, cánh hoa rơi',[36,36,528,670,20],S=>{
  const r=rng(41);
  let s=`<defs><linearGradient id="dao-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3EA"/><stop offset="1" stop-color="#F9B1C4"/></linearGradient></defs>`;
  s+=base(S,'url(#dao-g)');
  s+=lines(S,'#fff',3)+outline(14,14,572,772,10,'#E58AA5',1.5,'stroke-dasharray="2 6"');
  const sp=sprig({bark:'#5A3322',petal:'#FF93B2',center:'#D81B60',leaves:true});
  s+=`<g transform="translate(0 800) scale(1 -1)">${sp}</g><g transform="translate(600 800) scale(-1 1)">${sp}</g>`;
  for(let i=0;i<16;i++){const x=r()*W,y=r()*H;s+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="4" fill="#FF93B2" opacity="${f(.5+r()*.4)}" transform="rotate(${f(r()*180)} ${f(x)} ${f(y)})"/>`;}
  s+=`<text x="300" y="768" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="32" fill="#A3154F">Xuân An Khang</text>`;
  return s;
});

add('tet-03-long-den','tet','Lồng đèn đỏ','Ba chiếc lồng đèn treo từ trên xuống, tua rua vàng',[28,150,544,622,16],S=>{
  let s=base(S,'#8E0F17');
  s+=lines(S,GOLD,3);
  const lantern=(x,y,rx,ry,txt)=>{const id='ld'+(U++);
    let o=`<defs><radialGradient id="${id}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FF4A4F"/><stop offset="1" stop-color="#B3121C"/></radialGradient></defs>`;
    o+=`<line x1="${x}" y1="0" x2="${x}" y2="${y-ry-10}" stroke="${GOLD}" stroke-width="2.5"/><rect x="${x-14}" y="${y-ry-10}" width="28" height="10" rx="2" fill="${GOLD}" stroke="${GOLD_D}"/>`;
    o+=`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id})" stroke="${GOLD_D}" stroke-width="2"/>`;
    o+=`<ellipse cx="${x}" cy="${y}" rx="${f(rx*.62)}" ry="${ry}" fill="none" stroke="${GOLD}" stroke-width="1.6" opacity=".8"/><ellipse cx="${x}" cy="${y}" rx="${f(rx*.28)}" ry="${ry}" fill="none" stroke="${GOLD}" stroke-width="1.6" opacity=".8"/>`;
    o+=`<rect x="${x-14}" y="${y+ry}" width="28" height="10" rx="2" fill="${GOLD}" stroke="${GOLD_D}"/>`;
    for(let i=-2;i<=2;i++)o+=`<line x1="${x+i*4}" y1="${y+ry+10}" x2="${x+i*6}" y2="${y+ry+32}" stroke="${GOLD}" stroke-width="2"/>`;
    o+=`<circle cx="${x}" cy="${y+ry+30}" r="3.5" fill="${GOLD}"/>`;
    o+=`<text x="${x}" y="${y+7}" text-anchor="middle" font-family="${SERIF}" font-weight="bold" font-size="${f(rx*.5)}" fill="${GOLD}">${txt}</text>`;return o;};
  s+=lantern(100,86,38,32,'Phúc')+lantern(500,86,38,32,'Thọ')+lantern(300,96,48,40,'Lộc');
  [[190,40],[410,44],[200,110],[400,118],[20,60],[580,60]].forEach(([x,y])=>s+=sparkle(x,y,6,GOLD,.9));
  for(let y=200;y<770;y+=70){s+=coin(14,y,9,'#8E0F17')+coin(586,y,9,'#8E0F17');}
  return s;
});

add('tet-04-cau-doi','tet','Câu đối đỏ','Hai vế câu đối hai bên, hoành phi phía trên',[96,110,408,590,6],S=>{
  let s=base(S,'#A50E18');
  s+=lines(S,GOLD,3);
  const sc=(x,words)=>{let o=`<rect x="${x}" y="110" width="68" height="590" rx="4" fill="#7E0A12" stroke="${GOLD}" stroke-width="2"/>`;
    words.forEach((w,i)=>o+=`<text x="${x+34}" y="${168+i*92}" text-anchor="middle" font-family="${SERIF}" font-weight="bold" font-size="25" fill="${GOLD}">${w}</text>`);return o;};
  s+=sc(14,['Xuân','sang','phúc','lộc','đầy','nhà'])+sc(518,['Tết','đến','bình','an','vạn','sự']);
  s+=`<rect x="120" y="28" width="360" height="58" rx="6" fill="#7E0A12" stroke="${GOLD}" stroke-width="2"/><text x="300" y="67" text-anchor="middle" font-family="${SERIF}" font-weight="bold" font-size="30" fill="${GOLD}">Vạn Sự Như Ý</text>`;
  s+=`<text x="300" y="765" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="30" fill="${GOLD}">Xuân Đinh Mùi 2027</text>`;
  s+=coin(110,752,13,'#A50E18')+coin(490,752,13,'#A50E18');
  [[14,14],[586,14],[14,786],[586,786]].forEach(([x,y])=>s+=`<rect x="${x-6}" y="${y-6}" width="12" height="12" fill="${GOLD}" transform="rotate(45 ${x} ${y})"/>`);
  return s;
});

add('tet-05-bao-li-xi','tet','Bao lì xì','Phong bao đỏ có nắp gập, đồng xu vàng chạy hai bên',[44,215,512,520,14],S=>{
  let s=`<defs><linearGradient id="lx-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E0262F"/><stop offset="1" stop-color="#A60F1B"/></linearGradient></defs>`;
  s+=base(S,'url(#lx-g)');
  s+=`<path d="M0 0H600V80L300 214L0 80Z" fill="#EE4852" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round"/><path d="M0 0H600V70L300 196L0 70Z" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>`;
  s+=lines(S,GOLD,3);
  s+=`<circle cx="300" cy="172" r="40" fill="#E5B93C" stroke="${GOLD_D}" stroke-width="3"/><circle cx="300" cy="172" r="32" fill="none" stroke="${GOLD_D}" stroke-width="1.5"/><text x="300" y="181" text-anchor="middle" font-family="${SERIF}" font-weight="bold" font-size="25" fill="#9E0F1A">Lộc</text>`;
  for(let y=270;y<720;y+=62)s+=coin(22,y,10,'#BA1621')+coin(578,y,10,'#BA1621');
  s+=`<text x="300" y="780" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="34" fill="${GOLD}">Lì Xì May Mắn</text>`;
  return s;
});

add('tet-06-trong-dong','tet','Hoa văn trống đồng','Mặt trống đồng ở bốn góc, dải tam giác dọc viền',[40,40,520,680,6],S=>{
  let s=base(S,'#5B0A12');
  s+=`<defs><clipPath id="td-c"><path clip-rule="evenodd" d="${clipD(S)}"/></clipPath></defs><g clip-path="url(#td-c)">`;
  const drum=(cx,cy)=>{let p=[];for(let i=0;i<32;i++){const r=i%2?32:84,a=i*Math.PI/16;p.push(f(cx+Math.cos(a)*r)+','+f(cy+Math.sin(a)*r));}
    return`<circle cx="${cx}" cy="${cy}" r="112" fill="none" stroke="${GOLD}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="98" fill="none" stroke="${GOLD}" stroke-width="6" stroke-dasharray="3 6"/><circle cx="${cx}" cy="${cy}" r="88" fill="none" stroke="${GOLD}" stroke-width="2"/><polygon points="${p.join(' ')}" fill="${GOLD}"/><circle cx="${cx}" cy="${cy}" r="58" fill="#5B0A12" stroke="${GOLD}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="42" fill="none" stroke="${GOLD}" stroke-width="3" stroke-dasharray="2 5"/><circle cx="${cx}" cy="${cy}" r="22" fill="${GOLD}"/>`;};
  s+=drum(0,0)+drum(600,0)+drum(0,800)+drum(600,800);
  const N=88;for(let i=0;i<N;i++){const p=perim(20,20,560,760,i/N);if(Math.min(p.x,W-p.x)<125&&Math.min(p.y,H-p.y)<125)continue;
    const tx=p.ny,ty=-p.nx;s+=`<path d="M${f(p.x-tx*8-p.nx*6)} ${f(p.y-ty*8-p.ny*6)}L${f(p.x+tx*8-p.nx*6)} ${f(p.y+ty*8-p.ny*6)}L${f(p.x+p.nx*9)} ${f(p.y+p.ny*9)}Z" fill="${GOLD}"/>`;}
  s+=`</g>`+lines(S,GOLD,3);
  s+=`<text x="300" y="774" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="32" fill="${GOLD}">Chúc Mừng Năm Mới</text>`;
  return s;
});

add('tet-07-phao-hoa','tet','Pháo hoa giao thừa','Nền đêm xanh thẫm, pháo hoa nổ ở các góc',[30,30,540,680,18],S=>{
  const r=rng(51);
  let s=base(S,'#070B24');
  for(let i=0,n=0;i<300&&n<30;i++){const x=r()*W,y=r()*H;if(x>34&&x<566&&y>34&&y<706)continue;s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(1+r()*1.4)}" fill="#fff" opacity="${f(.4+r()*.5)}"/>`;n++;}
  s+=burst(88,92,72,'#FFC93C',14)+burst(518,78,62,'#FF4D6D',14)+burst(540,742,46,'#4DD0E1',12)+burst(62,746,44,'#FF7AD9',12)+burst(300,18,30,'#FFE08A',10);
  s+=lines(S,'rgba(255,201,60,.35)',2);
  s+=`<text x="300" y="772" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="32" fill="${GOLD}">Chúc Mừng Năm Mới</text>`;
  return s;
});

add('tet-08-phuc-loc-tho','tet','Phúc Lộc Thọ Khang','Bốn huy hiệu vàng ở góc, dải ruy băng Vạn Sự Như Ý',[60,60,480,620,10],S=>{
  let s=base(S,'#C1121F');
  s+=lines(S,GOLD,3);
  for(let i=0;i<70;i++){const p=perim(30,30,540,740,i/70);s+=`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="4" fill="${GOLD}"/>`;}
  const med=(x,y,t)=>`<circle cx="${x}" cy="${y}" r="46" fill="#E5B93C" stroke="${GOLD_D}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="38" fill="#8E0F17" stroke="${GOLD}" stroke-width="2"/><text x="${x}" y="${y+7}" text-anchor="middle" font-family="${SERIF}" font-weight="bold" font-size="20" fill="${GOLD}">${t}</text>`;
  s+=med(60,60,'Phúc')+med(540,60,'Lộc')+med(60,680,'Thọ')+med(540,680,'Khang');
  s+=`<path d="M130 726L92 746L130 768Z" fill="#D9A62B" stroke="${GOLD_D}" stroke-width="2"/><path d="M470 726L508 746L470 768Z" fill="#D9A62B" stroke="${GOLD_D}" stroke-width="2"/><rect x="130" y="716" width="340" height="54" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="2"/><text x="300" y="753" text-anchor="middle" font-family="${SERIF}" font-weight="bold" font-style="italic" font-size="30" fill="#8E0F17">Vạn Sự Như Ý</text>`;
  return s;
});

add('tet-09-banh-chung','tet','Bánh chưng xanh','Lá dong xanh buộc lạt giang, hoa mai nhỏ ở bốn góc',[40,40,520,680,12],S=>{
  let s=base(S,'#1F5B2F');
  for(const x of[10,20,30,570,580,590])s+=`<path d="M${x} 0V800" stroke="#2E7A42" stroke-width="2" opacity=".7"/>`;
  for(const y of[10,20,30])s+=`<path d="M40 ${y}H560" stroke="#2E7A42" stroke-width="2" opacity=".7"/>`;
  for(const y of[730,740,750,760,770,780,790])s+=`<path d="M40 ${y}H560" stroke="#2E7A42" stroke-width="2" opacity=".5"/>`;
  s+=`<path d="M0 0L40 40M600 0L560 40M0 800L40 720M600 800L560 720" stroke="#14421F" stroke-width="2"/>`;
  const strap='fill="#E8D7A8" stroke="#B59B5A" stroke-width="1.5"';
  [230,520].forEach(y=>s+=`<rect x="0" y="${y-6}" width="40" height="12" ${strap}/><rect x="560" y="${y-6}" width="40" height="12" ${strap}/>`);
  [110,490].forEach(x=>s+=`<rect x="${x-6}" y="0" width="12" height="40" ${strap}/><rect x="${x-6}" y="720" width="12" height="80" ${strap}/>`);
  s+=lines(S,'#E8D7A8',2);
  [[40,40],[560,40],[40,720],[560,720]].forEach(([x,y],i)=>s+=blossom(x,y,22,'#FFD21F','#E8920A',i*30));
  s+=`<text x="300" y="776" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="32" fill="#F4E9C7">Tết Đoàn Viên</text>`;
  return s;
});

add('tet-10-polaroid-xuan','tet','Polaroid Xuân Đinh Mùi','Ảnh lấy liền viền kem, nút thắt may mắn và cành mai',[44,44,512,580,4],S=>{
  let s=base(S,'#FFF5E2');
  s+=outline(.75,.75,598.5,798.5,6,'#E2D2B2',1.5)+lines(S,'#EBDDBF',2);
  const sp=sprig({bark:'#3E2412',petal:'#FFD21F',center:'#E8920A',leaves:false});
  s+=`<g transform="translate(600 800) rotate(180)">${sp}</g>`;
  s+=`<line x1="86" y1="0" x2="86" y2="62" stroke="#B0121B" stroke-width="3"/><rect x="72" y="62" width="28" height="28" rx="3" fill="#C1121F" stroke="#7E0A12" stroke-width="2" transform="rotate(45 86 76)"/><rect x="79" y="69" width="14" height="14" fill="none" stroke="${GOLD}" stroke-width="2" transform="rotate(45 86 76)"/>`;
  for(let i=-3;i<=3;i++)s+=`<line x1="${86+i*2}" y1="98" x2="${86+i*4}" y2="132" stroke="#C1121F" stroke-width="3"/>`;
  s+=`<text x="300" y="704" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="50" fill="#B0121B">Xuân Đinh Mùi</text>`;
  s+=`<text x="300" y="750" text-anchor="middle" font-family="${SERIF}" font-size="22" fill="#8A6A2E">Chúc Mừng Năm Mới 2027</text>`;
  s+=coin(92,722,15,'#FFF5E2')+coin(508,722,15,'#FFF5E2');
  return s;
});

/* ---------- ảnh mẫu ---------- */

export const seasonalFrameMetadata = F.map((frame) => ({
  id: frame.id,
  name: frame.name,
  category: frame.group === "noel" ? "Giáng sinh" : "Tết Nguyên Đán",
  description: frame.desc,
  slotCount: 4,
  width: 1200,
  height: 1600,
  aspectRatio: "3:4",
  exportSize: "1200×1600",
  background: frame.group === "noel" ? "#B3202A" : "#B0121B",
  accent: "#F2C14E",
  layout: "seasonal"
}));

function findFrame(id) {
  const frame = F.find((item) => item.id === id);
  if (!frame) throw new Error(`UNKNOWN_SEASONAL_FRAME:${id}`);
  return frame;
}

function getLayoutCount(value) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 4) {
    throw new RangeError("SEASONAL_FRAME_PHOTO_COUNT_MUST_BE_1_TO_4");
  }
  return count;
}

export function getSeasonalFrameSlots(id, photoCount = 4) {
  const frame = findFrame(id);
  return layout(frame.win, getLayoutCount(photoCount)).map((slot) => ({
    x: slot.x * 2,
    y: slot.y * 2,
    width: slot.w * 2,
    height: slot.h * 2
  }));
}

export function getSeasonalFrameSvg(id, photoCount = 4, slotsOverride) {
  const frame = findFrame(id);
  const count = slotsOverride ? slotsOverride.length : getLayoutCount(photoCount);
  if (slotsOverride && (count < 1 || count > 8)) {
    throw new RangeError("SEASONAL_FRAME_SLOT_COUNT_MUST_BE_1_TO_8");
  }
  const art = mk(frame, Math.min(count, 4));
  if (slotsOverride) {
    if (slotsOverride.length !== count) {
      throw new RangeError("SEASONAL_FRAME_SLOT_COUNT_MISMATCH");
    }
    art.slots = slotsOverride.map((slot) => ({
      x: slot.x / 2,
      y: slot.y / 2,
      w: slot.width / 2,
      h: slot.height / 2
    }));
  }
  U = 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="1200" height="1600">${frame.fn(art)}</svg>`;
}