const fs=require('fs'),vm=require('vm');
let html=fs.readFileSync('index.html','utf8');
html=html.replace('family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700','family=Manrope:wght@400;500;600;700');
html=html.replace('src="./assets/admin-demo-preview.png" width="1902" height="920"','src="./assets/admin-preview.webp" width="1600" height="774"');
html=html.replace('<span>7 активных</span>','<span>DEMO · <span>7 активных</span></span>');
html=html.replace('280 000 ₸ в год</b>','280 000 ₸ <span>в год</span></b>');
html=html.replace('            <header class="dashboard-topbar">','            <header class="dashboard-topbar">');
fs.writeFileSync('index.html',html);
let js=fs.readFileSync('js/index.js','utf8');
const start=js.indexOf('  const LANGUAGE_COPY = '),end=js.indexOf('  let currentLanguage');
const dictionaries=vm.runInNewContext(js.slice(start,end)+'\nLANGUAGE_COPY');
const more={
 'Пн':['Дс','Mon','Pzt'],'Вт':['Сс','Tue','Sal'],'Ср':['Ср','Wed','Çar'],'Чт':['Бс','Thu','Per'],'Пт':['Жм','Fri','Cum'],'Сб':['Сб','Sat','Cmt'],'Вс':['Жс','Sun','Paz'],
 'Тирамису MORI':['MORI тирамису','MORI tiramisu','MORI tiramisu'],
 'Круассан с лососем':['Албырт қосылған круассан','Salmon croissant','Somonlu kruvasan'],
 'Летний ягодный боул':['Жазғы жидек боулы','Summer berry bowl','Yaz meyveli bowl'],
 '326 сессий':['326 сессия','326 sessions','326 oturum'],
 'сессии':['сессия','sessions','oturum'],'сессия':['сессия','session','oturum'],
 'Выбор языка':['Тілді таңдау','Select language','Dil seçimi'],
 'Основная навигация':['Негізгі навигация','Main navigation','Ana gezinme'],
 'Мобильная навигация':['Мобильді навигация','Mobile navigation','Mobil gezinme'],
 'Ссылки в подвале':['Төменгі сілтемелер','Footer links','Alt bilgi bağlantıları'],
 'Exort, наверх':['Exort, жоғары','Exort, back to top','Exort, yukarı dön'],
 'Тип заведения':['Мекеме түрі','Venue type','İşletme türü'],
 'Примеры источников':['Дереккөз мысалдары','Example sources','Kaynak örnekleri'],
 'Демонстрационное мобильное меню Exort':['Exort демо мобильді мәзірі','Exort demo mobile menu','Exort demo mobil menüsü'],
 'Админ-панель Exort для управления блюдами и стоп-листом':['Тағамдар мен стоп-листті басқаратын Exort панелі','Exort admin panel for dishes and unavailable items','Ürünleri ve stok dışı listesini yönetmek için Exort paneli'],
 'Демонстрационный график активности по дням':['Күнделікті белсенділік демо-графигі','Example daily activity chart','Günlere göre demo etkinlik grafiği'],
 'Демонстрационная тепловая карта активности':['Белсенділіктің демо жылу картасы','Example activity heatmap','Demo etkinlik ısı haritası']
};
for(const [k,v] of Object.entries(more))['kk','en','tr'].forEach((l,i)=>dictionaries[l][k]=v[i]);
const used=new Set([...html.matchAll(/>([^<>]+)</g)].map(m=>m[1].replace(/\s+/g,' ').trim()));
for(const m of html.matchAll(/(?:aria-label|alt)="([^"]+)"/g)) used.add(m[1]);
const pruned={};for(const l of ['kk','en','tr'])pruned[l]=Object.fromEntries(Object.entries(dictionaries[l]).filter(([key])=>used.has(key)));
const serialized='  const LANGUAGE_COPY = {\n'+Object.entries(pruned).map(([l,d])=>'    '+l+': {\n'+Object.entries(d).map(([k,v])=>'      '+JSON.stringify(k)+': '+JSON.stringify(v)+',').join('\n')+'\n    },').join('\n')+'\n  };\n\n';
js=js.slice(0,start)+serialized+js.slice(end);
js=js.replace('  const header = document.querySelector("[data-header]");\n','').replace('  let scrollFrame = 0;\n','');
js=js.replace(/  function updateHeader\(\) \{[\s\S]*?(?=  function setMenu)/,'');
js=js.replace('  window.addEventListener("scroll", requestHeaderUpdate, { passive: true });\n','').replace('  updateHeader();\n','');
fs.writeFileSync('js/index.js',js);
console.log(JSON.stringify({translationKeys:Object.fromEntries(Object.entries(pruned).map(([k,v])=>[k,Object.keys(v).length])),missing:Object.fromEntries(Object.entries(pruned).map(([k,v])=>[k,[...used].filter(t=>/[А-Яа-я]/.test(t)&&!v[t])]))},null,2));
