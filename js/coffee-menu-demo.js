(() => {
  "use strict";

  const image = (id, width = 900) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=84`;

  const copy = {
    ru: {
      openNow: "Открыто до 22:00",
      positioning: "Specialty coffee · Завтраки весь день",
      addressShort: "Демо-город · вымышленная локация",
      viewMenu: "Смотреть меню",
      aboutLink: "О кофейне",
      cancel: "Отмена",
      searchPlaceholder: "Напиток, блюдо или ингредиент",
      todayEyebrow: "ВЫБОР MORI",
      todayTitle: "То, за чем возвращаются",
      todayText: "Наши главные вкусы и сезонные сочетания.",
      nothingFound: "Ничего не нашли",
      tryAnother: "Попробуйте другое название или ингредиент.",
      resetSearch: "Сбросить поиск",
      aboutEyebrow: "ЗАЙТИ В MORI",
      aboutTitle: "Кофе без спешки.<br />Завтраки без расписания.",
      aboutText: "Городская кофейня с зерном собственной обжарки, открытой кухней и спокойной музыкой.",
      demoDisclaimer: "MORI Coffee и все адреса, контакты и условия на этой странице вымышлены.",
      addressLabel: "Адрес",
      addressFull: "Демо-квартал MORI, павильон 00",
      hoursLabel: "Режим работы",
      hoursValue: "Ежедневно · 08:00–22:00",
      phoneLabel: "Телефон",
      poweredBy: "Меню работает на",
      wantMenu: "Хочу такое меню",
      popular: "Популярное",
      items: "позиций",
      ingredients: "Состав",
      allergens: "Аллергены",
      pairing: "Сочетается с",
      available: "Доступно сегодня",
      unavailable: "Временно недоступно",
      priceOnRequest: "Уточнить",
      newBadge: "Новинка",
      hitBadge: "Хит",
      seasonalBadge: "Сезонное",
    },
    kk: {
      openNow: "22:00-ге дейін ашық",
      positioning: "Specialty coffee · Күні бойы таңғы ас",
      addressShort: "Демо-қала · ойдан шығарылған орын",
      viewMenu: "Мәзірді көру",
      aboutLink: "Кофехана туралы",
      cancel: "Бас тарту",
      searchPlaceholder: "Сусын, тағам немесе ингредиент",
      todayEyebrow: "MORI ТАҢДАУЫ",
      todayTitle: "Қайта оралатын дәмдер",
      todayText: "Біздің басты дәмдеріміз бен маусымдық үйлесімдер.",
      nothingFound: "Ештеңе табылмады",
      tryAnother: "Басқа атауды немесе ингредиентті қолданып көріңіз.",
      resetSearch: "Іздеуді тазарту",
      aboutEyebrow: "MORI-ГЕ КЕЛІҢІЗ",
      aboutTitle: "Асықпай ішетін кофе.<br />Уақытсыз таңғы ас.",
      aboutText: "Өзіміз қуырған дән, ашық ас үй және жайлы музыкасы бар қалалық кофехана.",
      demoDisclaimer: "MORI Coffee және осы беттегі барлық мекенжайлар, байланыстар мен шарттар ойдан шығарылған.",
      addressLabel: "Мекенжай",
      addressFull: "MORI демо-кварталы, 00 павильон",
      hoursLabel: "Жұмыс уақыты",
      hoursValue: "Күн сайын · 08:00–22:00",
      phoneLabel: "Телефон",
      poweredBy: "Мәзір платформасы",
      wantMenu: "Осындай мәзір керек",
      popular: "Танымал",
      items: "позиция",
      ingredients: "Құрамы",
      allergens: "Аллергендер",
      pairing: "Үйлеседі",
      available: "Бүгін бар",
      unavailable: "Уақытша жоқ",
      priceOnRequest: "Нақтылау",
      newBadge: "Жаңа",
      hitBadge: "Хит",
      seasonalBadge: "Маусымдық",
    },
    en: {
      openNow: "Open until 10 PM",
      positioning: "Specialty coffee · All-day breakfast",
      addressShort: "Demo City · fictional location",
      viewMenu: "Explore menu",
      aboutLink: "About us",
      cancel: "Cancel",
      searchPlaceholder: "Drink, dish or ingredient",
      todayEyebrow: "MORI SELECTION",
      todayTitle: "Worth coming back for",
      todayText: "Our signatures and current seasonal pairings.",
      nothingFound: "Nothing found",
      tryAnother: "Try another name or ingredient.",
      resetSearch: "Reset search",
      aboutEyebrow: "VISIT MORI",
      aboutTitle: "Coffee without hurry.<br />Breakfast without a schedule.",
      aboutText: "An urban coffee shop with house-roasted beans, an open kitchen and mellow music.",
      demoDisclaimer: "MORI Coffee and every address, contact and condition on this page are fictional.",
      addressLabel: "Address",
      addressFull: "MORI Demo Quarter, Pavilion 00",
      hoursLabel: "Opening hours",
      hoursValue: "Daily · 8 AM–10 PM",
      phoneLabel: "Phone",
      poweredBy: "Menu powered by",
      wantMenu: "I want this menu",
      popular: "Popular",
      items: "items",
      ingredients: "Ingredients",
      allergens: "Allergens",
      pairing: "Pairs with",
      available: "Available today",
      unavailable: "Temporarily unavailable",
      priceOnRequest: "Ask us",
      newBadge: "New",
      hitBadge: "Bestseller",
      seasonalBadge: "Seasonal",
    },
  };

  const categories = [
    {
      id: "breakfast",
      name: { ru: "Завтраки", kk: "Таңғы ас", en: "Breakfast" },
      note: { ru: "Весь день", kk: "Күні бойы", en: "All day" },
    },
    {
      id: "coffee",
      name: { ru: "Кофе", kk: "Кофе", en: "Coffee" },
      note: { ru: "Классика и фильтр", kk: "Классика және фильтр", en: "Classics and filter" },
    },
    {
      id: "signature",
      name: { ru: "Авторские напитки", kk: "Авторлық сусындар", en: "Signature drinks" },
      note: { ru: "Вкус MORI", kk: "MORI дәмі", en: "The taste of MORI" },
    },
    {
      id: "noncoffee",
      name: { ru: "Не кофе", kk: "Кофесіз", en: "Not coffee" },
      note: { ru: "Матча, чай и какао", kk: "Матча, шай және какао", en: "Matcha, tea and cocoa" },
    },
    {
      id: "desserts",
      name: { ru: "Десерты", kk: "Десерттер", en: "Desserts" },
      note: { ru: "С нашей витрины", kk: "Біздің сөреден", en: "From our counter" },
    },
    {
      id: "sandwiches",
      name: { ru: "Сэндвичи", kk: "Сэндвичтер", en: "Sandwiches" },
      note: { ru: "На свежем хлебе", kk: "Жаңа піскен нанмен", en: "On fresh bread" },
    },
    {
      id: "seasonal",
      name: { ru: "Сезонное", kk: "Маусымдық", en: "Seasonal" },
      note: { ru: "Летняя коллекция", kk: "Жазғы топтама", en: "Summer collection" },
    },
  ];

  const items = [
    {
      id: "pistachio-raf",
      category: "signature",
      featured: true,
      badge: "hitBadge",
      name: { ru: "Фисташковый раф", kk: "Пістелі раф", en: "Pistachio raf" },
      description: {
        ru: "Сливочный кофе с пастой из обжаренной фисташки и щепоткой морской соли.",
        kk: "Қуырылған пісте пастасы мен теңіз тұзы қосылған кілегейлі кофе.",
        en: "Creamy coffee with roasted pistachio paste and a pinch of sea salt.",
      },
      price: 2400,
      meta: "300 мл",
      image: image("photo-1509042239860-f550ce710b93", 1100),
      ingredients: { ru: "Эспрессо, сливки, молоко, фисташковая паста, соль", kk: "Эспрессо, кілегей, сүт, пісте пастасы, тұз", en: "Espresso, cream, milk, pistachio paste, salt" },
      allergens: { ru: "Молоко, орехи", kk: "Сүт, жаңғақтар", en: "Milk, nuts" },
      pairing: { ru: "Тирамису MORI", kk: "MORI тирамисуы", en: "MORI tiramisu" },
      available: true,
    },
    {
      id: "strawberry-matcha",
      category: "seasonal",
      featured: true,
      badge: "seasonalBadge",
      name: { ru: "Айс-матча с клубникой", kk: "Құлпынайлы айс-матча", en: "Strawberry iced matcha" },
      description: {
        ru: "Церемониальная матча, клубничное пюре и холодное молоко.",
        kk: "Салтанатты матча, құлпынай езбесі және салқын сүт.",
        en: "Ceremonial matcha, strawberry purée and chilled milk.",
      },
      price: 2600,
      meta: "400 мл",
      image: image("photo-1513558161293-cdaf765ed2fd", 900),
      ingredients: { ru: "Матча, клубника, молоко, ваниль", kk: "Матча, құлпынай, сүт, ваниль", en: "Matcha, strawberry, milk, vanilla" },
      allergens: { ru: "Молоко", kk: "Сүт", en: "Milk" },
      pairing: { ru: "Лимонный тарт", kk: "Лимон тарты", en: "Lemon tart" },
      available: true,
    },
    {
      id: "salmon-croissant",
      category: "breakfast",
      featured: true,
      badge: "hitBadge",
      name: { ru: "Круассан с лососем", kk: "Албырт қосылған круассан", en: "Salmon croissant" },
      description: {
        ru: "Тёплый круассан, слабосолёный лосось, скрэмбл и крем-чиз.",
        kk: "Жылы круассан, аз тұздалған албырт, скрэмбл және крем-чиз.",
        en: "Warm croissant, cured salmon, soft scrambled eggs and cream cheese.",
      },
      price: 4200,
      meta: "310 г",
      image: image("photo-1555507036-ab1f4038808a", 900),
      ingredients: { ru: "Круассан, лосось, яйцо, крем-чиз, шпинат", kk: "Круассан, албырт, жұмыртқа, крем-чиз, шпинат", en: "Croissant, salmon, egg, cream cheese, spinach" },
      allergens: { ru: "Глютен, молоко, яйцо, рыба", kk: "Глютен, сүт, жұмыртқа, балық", en: "Gluten, milk, egg, fish" },
      pairing: { ru: "Фильтр-кофе", kk: "Фильтр-кофе", en: "Filter coffee" },
      available: true,
    },
    {
      id: "tiramisu",
      category: "desserts",
      featured: true,
      badge: "newBadge",
      name: { ru: "Тирамису MORI", kk: "MORI тирамисуы", en: "MORI tiramisu" },
      description: {
        ru: "Воздушный крем маскарпоне, савоярди и наш эспрессо-бленд.",
        kk: "Жеңіл маскарпоне кремі, савоярди және біздің эспрессо қоспасы.",
        en: "Light mascarpone cream, savoiardi and our house espresso blend.",
      },
      price: 2500,
      meta: "170 г",
      image: image("photo-1571877227200-a0d98ea607e9", 900),
      ingredients: { ru: "Маскарпоне, савоярди, эспрессо, какао", kk: "Маскарпоне, савоярди, эспрессо, какао", en: "Mascarpone, savoiardi, espresso, cocoa" },
      allergens: { ru: "Молоко, яйцо, глютен", kk: "Сүт, жұмыртқа, глютен", en: "Milk, egg, gluten" },
      pairing: { ru: "Эспрессо", kk: "Эспрессо", en: "Espresso" },
      available: true,
    },
    {
      id: "syrniki",
      category: "breakfast",
      name: { ru: "Сырники со сметанным кремом", kk: "Қаймақ кремі мен жидекті тосап қосылған ірімшік құймақтары", en: "Syrniki with sour cream" },
      description: { ru: "Нежные сырники, сметанный крем, сезонные ягоды и фисташка.", kk: "Жұмсақ сырниктер, қаймақ кремі, маусымдық жидектер мен пісте.", en: "Soft cottage cheese pancakes, sour cream, seasonal berries and pistachio." },
      price: 3200,
      meta: "280 г",
      image: image("photo-1528207776546-365bb710ee93"),
      ingredients: { ru: "Творог, яйцо, сметана, ягоды, фисташка", kk: "Сүзбе, жұмыртқа, қаймақ, жидектер, пісте", en: "Cottage cheese, egg, sour cream, berries, pistachio" },
      allergens: { ru: "Молоко, яйцо, орехи", kk: "Сүт, жұмыртқа, жаңғақтар", en: "Milk, egg, nuts" },
      pairing: { ru: "Капучино", kk: "Капучино", en: "Cappuccino" },
      available: true,
    },
    {
      id: "turkish-eggs",
      category: "breakfast",
      name: { ru: "Турецкие яйца", kk: "Түрікше жұмыртқа", en: "Turkish eggs" },
      description: { ru: "Яйца пашот, йогурт с чесноком, пряное масло и тартин.", kk: "Пашот жұмыртқасы, сарымсақты йогурт, дәмдеуіш май және тартин.", en: "Poached eggs, garlic yogurt, spiced butter and sourdough tartine." },
      price: 3600,
      meta: "330 г",
      image: image("photo-1525351484163-7529414344d8"),
      ingredients: { ru: "Яйцо, йогурт, сливочное масло, хлеб, зелень", kk: "Жұмыртқа, йогурт, сары май, нан, көк", en: "Egg, yogurt, butter, sourdough, herbs" },
      allergens: { ru: "Яйцо, молоко, глютен", kk: "Жұмыртқа, сүт, глютен", en: "Egg, milk, gluten" },
      pairing: { ru: "Американо", kk: "Американо", en: "Americano" },
      available: true,
    },
    {
      id: "granola",
      category: "breakfast",
      name: { ru: "Домашняя гранола", kk: "Үй граноласы", en: "House granola" },
      description: { ru: "Греческий йогурт, мёд, ореховая гранола и свежие фрукты.", kk: "Грек йогурты, бал, жаңғақты гранола және балғын жеміс.", en: "Greek yogurt, honey, nut granola and fresh fruit." },
      price: 2800,
      meta: "260 г",
      image: "",
      ingredients: { ru: "Йогурт, овсяные хлопья, орехи, мёд, фрукты", kk: "Йогурт, сұлы, жаңғақтар, бал, жеміс", en: "Yogurt, oats, nuts, honey, fruit" },
      allergens: { ru: "Молоко, орехи", kk: "Сүт, жаңғақтар", en: "Milk, nuts" },
      pairing: { ru: "Матча-латте", kk: "Матча-латте", en: "Matcha latte" },
      available: true,
    },
    {
      id: "cappuccino",
      category: "coffee",
      name: { ru: "Капучино", kk: "Капучино", en: "Cappuccino" },
      description: { ru: "Эспрессо-бленд MORI и шелковистое молоко.", kk: "MORI эспрессо қоспасы және жібектей сүт.", en: "MORI espresso blend with silky steamed milk." },
      price: 1600,
      meta: "250 мл",
      image: image("photo-1495474472287-4d71bcdd2085"),
      ingredients: { ru: "Эспрессо, молоко", kk: "Эспрессо, сүт", en: "Espresso, milk" },
      allergens: { ru: "Молоко", kk: "Сүт", en: "Milk" },
      pairing: { ru: "Круассан классический", kk: "Классикалық круассан", en: "Classic croissant" },
      available: true,
    },
    {
      id: "filter",
      category: "coffee",
      badge: "hitBadge",
      name: { ru: "Фильтр-кофе", kk: "Фильтр-кофе", en: "Filter coffee" },
      description: { ru: "Зерно недели с чистым, ягодным профилем.", kk: "Таза, жидекті профилі бар аптаның дәні.", en: "Our bean of the week with a clean, berry-led profile." },
      price: 1800,
      meta: "300 мл",
      image: "",
      ingredients: { ru: "Кофе, вода", kk: "Кофе, су", en: "Coffee, water" },
      allergens: { ru: "Нет", kk: "Жоқ", en: "None" },
      pairing: { ru: "Тирамису MORI", kk: "MORI тирамисуы", en: "MORI tiramisu" },
      available: true,
    },
    {
      id: "flat-white",
      category: "coffee",
      name: { ru: "Флэт уайт", kk: "Флэт уайт", en: "Flat white" },
      description: { ru: "Двойной ристретто и тонкая молочная текстура.", kk: "Қос ристретто және жұқа сүт текстурасы.", en: "Double ristretto with a thin, velvety milk texture." },
      price: 1900,
      meta: "200 мл",
      image: image("photo-1517701604599-bb29b565090c"),
      ingredients: { ru: "Двойной ристретто, молоко", kk: "Қос ристретто, сүт", en: "Double ristretto, milk" },
      allergens: { ru: "Молоко", kk: "Сүт", en: "Milk" },
      pairing: { ru: "Канеле", kk: "Канеле", en: "Canelé" },
      available: true,
    },
    {
      id: "espresso-tonic",
      category: "signature",
      badge: "newBadge",
      name: { ru: "Эспрессо-тоник с юдзу", kk: "Юдзулі эспрессо-тоник", en: "Yuzu espresso tonic" },
      description: { ru: "Яркий эспрессо, сухой тоник и цитрусовый юдзу.", kk: "Жарқын эспрессо, құрғақ тоник және цитрусты юдзу.", en: "Bright espresso, dry tonic and citrusy yuzu." },
      price: 2300,
      meta: "350 мл",
      image: image("photo-1513558161293-cdaf765ed2fd"),
      ingredients: { ru: "Эспрессо, тоник, юдзу, лёд", kk: "Эспрессо, тоник, юдзу, мұз", en: "Espresso, tonic, yuzu, ice" },
      allergens: { ru: "Нет", kk: "Жоқ", en: "None" },
      pairing: { ru: "Лимонный тарт", kk: "Лимон тарты", en: "Lemon tart" },
      available: true,
    },
    {
      id: "salted-maple",
      category: "signature",
      name: { ru: "Солёный клён", kk: "Тұзды үйеңкі", en: "Salted maple" },
      description: { ru: "Латте с кленовым сиропом, солёной карамелью и мускатным орехом.", kk: "Үйеңкі шәрбаты, тұзды карамель және мускат жаңғағы қосылған латте.", en: "Latte with maple syrup, salted caramel and nutmeg." },
      price: 2300,
      meta: "300 мл",
      image: "",
      ingredients: { ru: "Эспрессо, молоко, клён, карамель, мускат", kk: "Эспрессо, сүт, үйеңкі, карамель, мускат", en: "Espresso, milk, maple, caramel, nutmeg" },
      allergens: { ru: "Молоко", kk: "Сүт", en: "Milk" },
      pairing: { ru: "Банановый кекс", kk: "Банан кексі", en: "Banana bread" },
      available: false,
    },
    {
      id: "matcha-latte",
      category: "noncoffee",
      name: { ru: "Матча-латте", kk: "Матча-латте", en: "Matcha latte" },
      description: { ru: "Церемониальная матча и молоко на выбор.", kk: "Салтанатты матча және таңдауыңыздағы сүт.", en: "Ceremonial matcha with your choice of milk." },
      price: 2100,
      meta: "300 мл",
      image: image("photo-1536256263959-770b48d82b0a"),
      ingredients: { ru: "Матча, молоко", kk: "Матча, сүт", en: "Matcha, milk" },
      allergens: { ru: "Молоко", kk: "Сүт", en: "Milk" },
      pairing: { ru: "Сырники", kk: "Сырниктер", en: "Syrniki" },
      available: true,
    },
    {
      id: "cocoa",
      category: "noncoffee",
      name: { ru: "Какао 70%", kk: "70% какао", en: "70% cocoa" },
      description: { ru: "Горький шоколад, какао и молоко без лишней сладости.", kk: "Ащы шоколад, какао және аса тәтті емес сүт.", en: "Dark chocolate, cocoa and milk, kept deliberately not too sweet." },
      price: 1900,
      meta: "300 мл",
      image: "",
      ingredients: { ru: "Шоколад, какао, молоко", kk: "Шоколад, какао, сүт", en: "Chocolate, cocoa, milk" },
      allergens: { ru: "Молоко", kk: "Сүт", en: "Milk" },
      pairing: { ru: "Круассан", kk: "Круассан", en: "Croissant" },
      available: true,
    },
    {
      id: "buckwheat-tea",
      category: "noncoffee",
      name: { ru: "Гречишный чай", kk: "Қарақұмық шайы", en: "Buckwheat tea" },
      description: { ru: "Тёплый орехово-карамельный вкус без кофеина.", kk: "Кофеинсіз жылы жаңғақ-карамель дәмі.", en: "A warm nutty-caramel cup without caffeine." },
      price: 1500,
      meta: "450 мл",
      image: "",
      ingredients: { ru: "Татарская гречиха, вода", kk: "Татар қарақұмығы, су", en: "Tartary buckwheat, water" },
      allergens: { ru: "Нет", kk: "Жоқ", en: "None" },
      pairing: { ru: "Баскский чизкейк", kk: "Баск чизкейкі", en: "Basque cheesecake" },
      available: true,
    },
    {
      id: "basque",
      category: "desserts",
      name: { ru: "Баскский чизкейк", kk: "Баск чизкейкі", en: "Basque cheesecake" },
      description: { ru: "Карамельная корочка и мягкая сливочная середина.", kk: "Карамельді қабық және жұмсақ кілегейлі ортасы.", en: "Caramelised top with a soft, creamy centre." },
      price: 2600,
      meta: "160 г",
      image: image("photo-1578985545062-69928b1d9587"),
      ingredients: { ru: "Крем-чиз, сливки, яйцо, сахар", kk: "Крем-чиз, кілегей, жұмыртқа, қант", en: "Cream cheese, cream, egg, sugar" },
      allergens: { ru: "Молоко, яйцо", kk: "Сүт, жұмыртқа", en: "Milk, egg" },
      pairing: { ru: "Фильтр-кофе", kk: "Фильтр-кофе", en: "Filter coffee" },
      available: true,
    },
    {
      id: "lemon-tart",
      category: "desserts",
      badge: "seasonalBadge",
      name: { ru: "Лимонный тарт", kk: "Лимон тарты", en: "Lemon tart" },
      description: { ru: "Яркий лимонный курд и тонкая меренга.", kk: "Жарқын лимон курды және жеңіл меренга.", en: "Bright lemon curd with a light torched meringue." },
      price: 2300,
      meta: "140 г",
      image: image("photo-1519915028121-7d3463d20b13"),
      ingredients: { ru: "Лимон, яйцо, сливочное масло, мука", kk: "Лимон, жұмыртқа, сары май, ұн", en: "Lemon, egg, butter, flour" },
      allergens: { ru: "Яйцо, молоко, глютен", kk: "Жұмыртқа, сүт, глютен", en: "Egg, milk, gluten" },
      pairing: { ru: "Эспрессо-тоник", kk: "Эспрессо-тоник", en: "Espresso tonic" },
      available: true,
    },
    {
      id: "chicken-sandwich",
      category: "sandwiches",
      name: { ru: "Сэндвич с цыплёнком", kk: "Тауық еті қосылған сэндвич", en: "Chicken sandwich" },
      description: { ru: "Цыплёнок, песто, вяленые томаты и моцарелла на чиабатте.", kk: "Чиабаттадағы тауық еті, песто, кептірілген қызанақ және моцарелла.", en: "Chicken, pesto, sun-dried tomato and mozzarella on ciabatta." },
      price: 3500,
      meta: "290 г",
      image: image("photo-1528735602780-2552fd46c7af"),
      ingredients: { ru: "Чиабатта, цыплёнок, песто, томаты, моцарелла", kk: "Чиабатта, тауық еті, песто, қызанақ, моцарелла", en: "Ciabatta, chicken, pesto, tomato, mozzarella" },
      allergens: { ru: "Глютен, молоко, орехи", kk: "Глютен, сүт, жаңғақтар", en: "Gluten, milk, nuts" },
      pairing: { ru: "Айс-американо", kk: "Айс-американо", en: "Iced americano" },
      available: true,
    },
    {
      id: "veggie-sandwich",
      category: "sandwiches",
      name: { ru: "Зелёный сэндвич", kk: "Жасыл сэндвич", en: "Green sandwich" },
      description: { ru: "Авокадо, огурец, шпинат, фета и зелёный соус.", kk: "Авокадо, қияр, шпинат, фета және жасыл тұздық.", en: "Avocado, cucumber, spinach, feta and a bright herb sauce." },
      price: 3300,
      meta: "270 г",
      image: "",
      ingredients: { ru: "Хлеб, авокадо, огурец, шпинат, фета", kk: "Нан, авокадо, қияр, шпинат, фета", en: "Bread, avocado, cucumber, spinach, feta" },
      allergens: { ru: "Глютен, молоко", kk: "Глютен, сүт", en: "Gluten, milk" },
      pairing: { ru: "Матча-латте", kk: "Матча-латте", en: "Matcha latte" },
      available: true,
    },
    {
      id: "peach-soda",
      category: "seasonal",
      badge: "newBadge",
      name: { ru: "Белый персик и жасмин", kk: "Ақ шабдалы және жасмин", en: "White peach and jasmine" },
      description: { ru: "Домашняя газировка с белым персиком, жасмином и лаймом.", kk: "Ақ шабдалы, жасмин және лайм қосылған үй лимонады.", en: "House soda with white peach, jasmine and lime." },
      price: 2200,
      meta: "400 мл",
      image: image("photo-1513558161293-cdaf765ed2fd"),
      ingredients: { ru: "Персик, жасмин, лайм, содовая", kk: "Шабдалы, жасмин, лайм, сода", en: "Peach, jasmine, lime, soda" },
      allergens: { ru: "Нет", kk: "Жоқ", en: "None" },
      pairing: { ru: "Лимонный тарт", kk: "Лимон тарты", en: "Lemon tart" },
      available: true,
    },
    {
      id: "berry-bowl",
      category: "seasonal",
      name: { ru: "Летний ягодный боул", kk: "Жазғы жидек боулы", en: "Summer berry bowl" },
      description: { ru: "Густой ягодный смузи, гранола, банан и свежие ягоды.", kk: "Қою жидек смузиі, гранола, банан және балғын жидектер.", en: "Thick berry smoothie, granola, banana and fresh berries." },
      price: null,
      meta: "320 г",
      image: image("photo-1511690743698-d9d85f2fbf38"),
      ingredients: { ru: "Ягоды, банан, гранола, кокос", kk: "Жидектер, банан, гранола, кокос", en: "Berries, banana, granola, coconut" },
      allergens: { ru: "Орехи, глютен", kk: "Жаңғақтар, глютен", en: "Nuts, gluten" },
      pairing: { ru: "Фильтр-кофе", kk: "Фильтр-кофе", en: "Filter coffee" },
      available: false,
    },
  ];

  const state = {
    language: "ru",
    query: "",
    sheetItem: null,
    touchStartY: 0,
    touchDeltaY: 0,
  };

  const els = {
    nav: document.querySelector("[data-category-nav]"),
    featured: document.querySelector("[data-featured-grid]"),
    sections: document.querySelector("[data-menu-sections]"),
    empty: document.querySelector("[data-empty-state]"),
    drawer: document.querySelector("[data-search-drawer]"),
    search: document.querySelector("[data-search-input]"),
    sheetLayer: document.querySelector("[data-sheet-layer]"),
    sheet: document.querySelector("[data-product-sheet]"),
    sheetContent: document.querySelector("[data-sheet-content]"),
  };

  const text = (value) => value?.[state.language] || value?.ru || "";
  const t = (key) => copy[state.language][key] || copy.ru[key] || key;
  const formatPrice = (value) => (value == null ? t("priceOnRequest") : `${value.toLocaleString("ru-RU")} ₸`);
  const formatItemCount = (count) => {
    if (state.language === "en") return `${count} ${count === 1 ? "item" : "items"}`;
    if (state.language === "kk") return `${count} позиция`;
    const mod10 = count % 10;
    const mod100 = count % 100;
    const word = mod10 === 1 && mod100 !== 11 ? "позиция" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "позиции" : "позиций";
    return `${count} ${word}`;
  };
  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function itemMatches(item) {
    const query = state.query.trim().toLocaleLowerCase(state.language);
    if (!query) return true;
    const searchable = [text(item.name), text(item.description), text(item.ingredients), text(item.allergens)]
      .join(" ")
      .toLocaleLowerCase(state.language);
    return searchable.includes(query);
  }

  function badgeLabel(item) {
    return item.badge ? t(item.badge) : "";
  }

  function renderNav() {
    const visibleCategories = categories.filter((category) =>
      items.some((item) => item.category === category.id && itemMatches(item)),
    );
    const popularVisible = items.some((item) => item.featured && itemMatches(item));
    els.nav.innerHTML = [
      popularVisible ? `<button type="button" class="is-active" data-nav-target="popular">${escapeHtml(t("popular"))}</button>` : "",
      ...visibleCategories.map(
        (category) =>
          `<button type="button" data-nav-target="${category.id}">${escapeHtml(text(category.name))}</button>`,
      ),
    ].join("");
  }

  function renderFeatured() {
    const featured = items.filter((item) => item.featured && itemMatches(item));
    const section = els.featured.closest(".intro-section");
    section.id = "popular";
    section.style.display = featured.length ? "" : "none";
    els.featured.innerHTML = featured
      .map(
        (item) => `
          <button class="featured-card" type="button" data-item-id="${item.id}" aria-label="${escapeHtml(text(item.name))}">
            <img src="${item.image}" alt="" loading="lazy" />
            <span class="featured-card__content">
              ${item.badge ? `<span class="featured-card__badge">${escapeHtml(badgeLabel(item))}</span>` : ""}
              <h3>${escapeHtml(text(item.name))}</h3>
              <span class="featured-card__meta">
                <span>${escapeHtml(item.meta)}</span>
                <strong>${escapeHtml(formatPrice(item.price))}</strong>
              </span>
            </span>
          </button>
        `,
      )
      .join("");
  }

  function renderCard(item) {
    const hasImage = Boolean(item.image);
    return `
      <button
        class="menu-card${hasImage ? "" : " menu-card--no-image"}${item.available ? "" : " menu-card--unavailable"}"
        type="button"
        data-item-id="${item.id}"
        aria-label="${escapeHtml(text(item.name))}"
      >
        <span class="menu-card__copy">
          <span class="menu-card__title-row">
            <h3>${escapeHtml(text(item.name))}</h3>
          </span>
          ${item.description ? `<span class="menu-card__description">${escapeHtml(text(item.description))}</span>` : ""}
          <span class="menu-card__footer">
            <span class="menu-card__meta">${escapeHtml(item.meta || "")}</span>
            <strong class="menu-card__price">${escapeHtml(formatPrice(item.price))}</strong>
          </span>
        </span>
        ${
          hasImage
            ? `<span class="menu-card__image">
                <img src="${item.image}" alt="" loading="lazy" />
                ${item.badge ? `<span class="item-badge">${escapeHtml(badgeLabel(item))}</span>` : ""}
              </span>`
            : ""
        }
      </button>
    `;
  }

  function renderSections() {
    let visibleCount = 0;
    els.sections.innerHTML = categories
      .map((category) => {
        const categoryItems = items.filter((item) => item.category === category.id && itemMatches(item));
        if (!categoryItems.length) return "";
        visibleCount += categoryItems.length;
        return `
          <section class="menu-section" id="${category.id}" data-menu-section="${category.id}">
            <header class="menu-section__header">
              <div>
                <h2>${escapeHtml(text(category.name))}</h2>
                <p>${escapeHtml(text(category.note))}</p>
              </div>
              <p>${escapeHtml(formatItemCount(categoryItems.length))}</p>
            </header>
            <div class="menu-list">${categoryItems.map(renderCard).join("")}</div>
          </section>
        `;
      })
      .join("");

    const featuredCount = items.filter((item) => item.featured && itemMatches(item)).length;
    els.empty.hidden = visibleCount + featuredCount > 0;
  }

  function updateStaticCopy() {
    document.documentElement.lang = state.language === "kk" ? "kk" : state.language;
    document.querySelectorAll("[data-copy]").forEach((node) => {
      const key = node.dataset.copy;
      if (key === "aboutTitle") node.innerHTML = t(key);
      else node.textContent = t(key);
    });
    els.search.placeholder = t("searchPlaceholder");
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.language === state.language);
    });
  }

  function renderAll() {
    updateStaticCopy();
    renderNav();
    renderFeatured();
    renderSections();
    requestAnimationFrame(observeSections);
  }

  let sectionObserver;
  function observeSections() {
    sectionObserver?.disconnect();
    const sections = document.querySelectorAll("#popular, [data-menu-section]");
    if (!sections.length || !("IntersectionObserver" in window)) return;
    sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.id;
        const active = els.nav.querySelector(`[data-nav-target="${id}"]`);
        if (!active) return;
        els.nav.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button === active));
        active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      },
      { rootMargin: "-72px 0px -55%", threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => {
      if (section.style.display !== "none") sectionObserver.observe(section);
    });
  }

  function openSearch() {
    els.drawer.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    setTimeout(() => els.search.focus(), 220);
  }

  function closeSearch({ reset = false } = {}) {
    if (reset) {
      state.query = "";
      els.search.value = "";
      renderAll();
    }
    els.drawer.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
  }

  function openSheet(itemId) {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    state.sheetItem = item;
    const meta = [item.meta, item.badge ? badgeLabel(item) : ""].filter(Boolean);
    els.sheetContent.innerHTML = `
      ${item.image ? `<img class="sheet-image" src="${item.image}" alt="${escapeHtml(text(item.name))}" />` : `<div class="sheet-image-placeholder">MORI</div>`}
      <div class="sheet-body">
        <div class="sheet-body__top">
          <h2 id="sheet-title">${escapeHtml(text(item.name))}</h2>
          <strong class="sheet-price">${escapeHtml(formatPrice(item.price))}</strong>
        </div>
        ${item.description ? `<p class="sheet-description">${escapeHtml(text(item.description))}</p>` : ""}
        <div class="sheet-meta">${meta.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>
        <div class="sheet-facts">
          <div class="sheet-fact"><span>${escapeHtml(t("ingredients"))}</span><strong>${escapeHtml(text(item.ingredients))}</strong></div>
          <div class="sheet-fact"><span>${escapeHtml(t("allergens"))}</span><strong>${escapeHtml(text(item.allergens))}</strong></div>
          <div class="sheet-fact"><span>${escapeHtml(t("pairing"))}</span><strong>${escapeHtml(text(item.pairing))}</strong></div>
        </div>
        <div class="availability${item.available ? "" : " is-unavailable"}">${escapeHtml(t(item.available ? "available" : "unavailable"))}</div>
      </div>
    `;
    els.sheetLayer.classList.add("is-open");
    els.sheetLayer.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-sheet-open");
    els.sheet.scrollTop = 0;
    setTimeout(() => document.querySelector("[data-sheet-close].sheet-close")?.focus(), 330);
  }

  function closeSheet() {
    els.sheetLayer.classList.remove("is-open");
    els.sheetLayer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-sheet-open");
    state.sheetItem = null;
    els.sheet.style.transform = "";
  }

  document.addEventListener("click", (event) => {
    const language = event.target.closest("[data-language]");
    if (language) {
      state.language = language.dataset.language;
      try {
        localStorage.setItem("mori_demo_language", state.language);
      } catch {}
      renderAll();
      if (state.sheetItem) openSheet(state.sheetItem.id);
      return;
    }

    if (event.target.closest("[data-search-toggle]")) return openSearch();
    if (event.target.closest("[data-search-close]")) return closeSearch();
    if (event.target.closest("[data-search-clear]")) {
      state.query = "";
      els.search.value = "";
      els.search.focus();
      renderAll();
      return;
    }
    if (event.target.closest("[data-reset-search]")) return closeSearch({ reset: true });
    if (event.target.closest("[data-scroll-menu]")) {
      document.querySelector("#popular")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const navButton = event.target.closest("[data-nav-target]");
    if (navButton) {
      document.getElementById(navButton.dataset.navTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const card = event.target.closest("[data-item-id]");
    if (card) return openSheet(card.dataset.itemId);
    if (event.target.closest("[data-sheet-close]")) return closeSheet();
  });

  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.sheetItem) closeSheet();
      else if (els.drawer.classList.contains("is-open")) closeSearch();
    }
  });

  els.sheet.addEventListener("touchstart", (event) => {
    if (els.sheet.scrollTop > 0) return;
    state.touchStartY = event.touches[0].clientY;
    state.touchDeltaY = 0;
  }, { passive: true });

  els.sheet.addEventListener("touchmove", (event) => {
    if (!state.touchStartY || els.sheet.scrollTop > 0) return;
    state.touchDeltaY = Math.max(0, event.touches[0].clientY - state.touchStartY);
    if (state.touchDeltaY > 0) els.sheet.style.transform = `translateY(${Math.min(state.touchDeltaY, 180)}px)`;
  }, { passive: true });

  els.sheet.addEventListener("touchend", () => {
    if (state.touchDeltaY > 105) closeSheet();
    else els.sheet.style.transform = "";
    state.touchStartY = 0;
    state.touchDeltaY = 0;
  }, { passive: true });

  try {
    const savedLanguage = localStorage.getItem("mori_demo_language");
    if (["ru", "kk", "en"].includes(savedLanguage)) state.language = savedLanguage;
  } catch {}

  renderAll();
})();
