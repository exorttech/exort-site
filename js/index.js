(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const languageButtons = Array.from(document.querySelectorAll("[data-language]"));
  const LANGUAGE_STORAGE_KEY = "exort-new-language";
  const SUPPORTED_LANGUAGES = ["ru", "kk", "en", "tr"];
  const LANGUAGE_LOCALES = {
    ru: "ru-RU",
    kk: "kk-KZ",
    en: "en-US",
    tr: "tr-TR",
  };
  const LANGUAGE_COPY = {
    kk: {
      "Перейти к содержанию": "Мазмұнға өту",
      "Открыть демо": "Демоны ашу",
      "Обсудить подключение": "Қосуды талқылау",
      "Продукт": "Өнім",
      "Управление": "Басқару",
      "Аналитика": "Аналитика",
      "Стоимость": "Баға",
      "QR-коды": "QR-кодтар",
      "Демо-меню": "Демо-мәзір",
      "Демо-админка": "Демо-әкімдік",
      "Цифровое меню для заведений": "Заведенияларға арналған цифрлық мәзір",
      "Меню становится": "Мәзір заведениенің",
      "продуктом": "өніміне",
      "заведения.": "айналады.",
      "Exort создаёт цифровое меню под стиль заведения и даёт владельцу админ-панель, аналитику и отдельные QR-коды для разных точек входа.": "Exort заведениенің стиліне сай цифрлық мәзір жасап, иесіне админ-панель, аналитика және әр кіру нүктесіне бөлек QR-код береді.",
      "Посмотреть демо-меню": "Демо-мәзірді көру",
      "Как управляется меню": "Мәзір қалай басқарылады",
      "4 языка": "4 тіл",
      "Без приложения": "Қосымшасыз",
      "открывается в браузере": "браузерде ашылады",
      "Живые изменения": "Жедел өзгерістер",
      "без перепечатки меню": "мәзірді қайта басусыз",
      "Один продукт, две стороны": "Бір өнім, екі тарап",
      "Красиво для гостя.": "Қонаққа әдемі.",
      "Понятно для владельца.": "Иесіне түсінікті.",
      "Гость быстро находит нужное. Команда заведения обновляет меню и видит интерес аудитории в одном рабочем пространстве.": "Қонақ керегін тез табады. Команда мәзірді жаңартып, аудитория қызығушылығын бір жерде көреді.",
      "Гость открывает QR": "Қонақ QR ашады",
      "Без установки приложения и без тяжёлого PDF.": "Қосымша орнатпай және ауыр PDF-сіз.",
      "Изучает живое меню": "Жанды мәзірді қарайды",
      "Категории, поиск, языки и подробные карточки блюд.": "Санаттар, іздеу, тілдер және тағам карталары.",
      "Владелец видит интерес": "Иесі қызығушылықты көреді",
      "Открытия, вовлечение, источники и динамика по времени.": "Ашулар, вовлечение, дереккөздер және уақыт динамикасы.",
      "Меню для гостя": "Қонақ мәзірі",
      "Не файл для просмотра. Интерфейс, которым удобно пользоваться.": "Көруге арналған файл емес. Қолдануға ыңғайлы интерфейс.",
      "Дизайн адаптируется под характер ресторана, кофейни, бара или гостиницы. Структура остаётся быстрой и понятной на любом телефоне.": "Дизайн ресторан, кофейня, бар немесе қонақүй сипатына бейімделеді. Құрылым кез келген телефонда жылдам әрі түсінікті қалады.",
      "Поиск и категории": "Іздеу және санаттар",
      "Нужное блюдо находится за несколько касаний.": "Керек тағам бірнеше түртумен табылады.",
      "Фото и подробная карточка": "Фото және толық карточка",
      "Описание, цена, состав и доступность собраны вместе.": "Сипаттама, баға, құрамы және қолжетімділігі бірге.",
      "Переключение языка и автоматический перевод.": "Тілді ауыстыру және автоматты аударма.",
      "Стиль заведения": "Заведение стилі",
      "Цвет, типографика и подача подстраиваются под бренд.": "Түс, типографика және беру стилі брендке бейімделеді.",
      "Открыть живое демо": "Жанды демоны ашу",
      "ПОИСК": "ІЗДЕУ",
      "4 ЯЗЫКА": "4 ТІЛ",
      "Подробная карточка": "Толық карточка",
      "Фисташковый раф": "Пісте раф",
      "Эспрессо · молоко · фисташка": "Эспрессо · сүт · пісте",
      "Админ-панель владельца": "Иесінің админ-панелі",
      "Меню меняется тогда, когда это нужно заведению.": "Мәзір заведениеге керек сәтте өзгереді.",
      "Команда управляет содержанием самостоятельно и сразу видит результат на гостевой странице.": "Команда контентті өзі басқарып, нәтижені қонақ бетінде бірден көреді.",
      "Создавайте позиции": "Позициялар жасаңыз",
      "Название, описание, цена, вес и фотография.": "Атауы, сипаттамасы, бағасы, салмағы және фотосы.",
      "Управляйте структурой": "Құрылымды басқарыңыз",
      "Категории, порядок и временное скрытие.": "Санаттар, реті және уақытша жасыру.",
      "Включайте стоп-лист": "Стоп-лист қосыңыз",
      "Недоступная позиция сразу меняет статус.": "Қолжетімсіз позиция статусты бірден өзгертеді.",
      "Exort · управление меню": "Exort · мәзір басқару",
      "опубликовано": "жарияланды",
      "Проверяйте контент": "Контентті тексеріңіз",
      "Видно, где не хватает фото или перевода.": "Фото немесе аударма жетіспейтін жер көрінеді.",
      "Переводите автоматически": "Автоматты аударыңыз",
      "Черновик перевода можно проверить перед публикацией.": "Аударма жобасын жарияламас бұрын тексеруге болады.",
      "Смотрите предпросмотр": "Алдын ала көріңіз",
      "Изменения видны глазами гостя до запуска.": "Іске қоспай тұрып өзгерістер қонақ көзімен көрінеді.",
      "Открыть демо-админку": "Демо-әкімдікті ашу",
      "Аналитика интереса": "Қызығушылық аналитикасы",
      "Не догадки о меню, а понятные сигналы.": "Мәзір туралы болжам емес, түсінікті сигналдар.",
      "Exort показывает открытия меню, вовлечение, интерес к позициям и источники переходов. Это не данные о заказах или выручке.": "Exort мәзір ашуларын, вовлечениені, позицияларға қызығушылықты және өту көздерін көрсетеді. Бұл тапсырыс немесе табыс деректері емес.",
      "Последние 7 дней": "Соңғы 7 күн",
      "Сессии меню": "Мәзір сессиялары",
      "полноценные открытия": "толық ашулар",
      "Вовлечённые гости": "Белсенді қонақтар",
      "открыли хотя бы одно блюдо": "кемінде бір тағам ашты",
      "Открытия блюд": "Тағам ашулары",
      "интерес к карточкам": "карточкаларға қызығушылық",
      "Среднее изучение": "Орташа қарау",
      "на одну сессию": "бір сессияға",
      "Активность гостей": "Қонақ белсенділігі",
      "Сессии по дням": "Күндер бойынша сессиялар",
      "+18% к прошлой неделе": "өткен аптадан +18%",
      "Автоматические выводы": "Автоматты қорытындылар",
      "Что стоит заметить": "Нені байқау керек",
      "В пятницу меню открывали на 34% чаще": "Жұма күні мәзір 34% жиі ашылды",
      "Пик интереса — с 18:00 до 21:00": "Қызығушылық шыңы 18:00-21:00",
      "Фисташковый раф поднялся на второе место": "Пісте раф екінші орынға көтерілді",
      "Рост открытий за последние семь дней": "Соңғы жеті күндегі ашулар өсімі",
      "Три позиции почти не открывают": "Үш позиция сирек ашылады",
      "Стоит проверить фото, название или расположение": "Фото, атау немесе орналасуды тексерген жөн",
      "Интерес к позициям": "Позициялар қызығушылығы",
      "Популярные блюда": "Танымал тағамдар",
      "Открытия": "Ашулар",
      "Дни и часы": "Күндер мен сағаттар",
      "Когда изучают меню": "Мәзір қашан қаралады",
      "Языки": "Тілдер",
      "Устройства": "Құрылғылар",
      "Главный источник": "Негізгі дереккөз",
      "Главный зал": "Негізгі зал",
      "сессий": "сессия",
      "QR-коды и источники": "QR-кодтар және дереккөздер",
      "Каждая точка входа получает своё имя.": "Әр кіру нүктесінің өз атауы болады.",
      "Один дизайн меню, разные QR-коды и ссылки. В аналитике видно, откуда открывали меню: из зала, Instagram, номера гостиницы или зоны ресепшен.": "Бір мәзір дизайны, әртүрлі QR-кодтар мен сілтемелер. Аналитикада мәзір қай жерден ашылғаны көрінеді: залдан, Instagram-нан, қонақүй бөлмесінен немесе ресепшен аймағынан.",
      "Столы": "Үстелдер",
      "Летняя терраса": "Жазғы терраса",
      "Гостиничные номера": "Қонақүй нөмірлері",
      "Ресепшен": "Ресепшен",
      "Вход": "Кіру",
      "Источники показывают переходы и вовлечение, а не покупки или выручку.": "Дереккөздер сатып алу не табысты емес, өтулер мен вовлечениені көрсетеді.",
      "Источники меню": "Мәзір дереккөздері",
      "7 активных": "7 белсенді",
      "+ Новый источник": "+ Жаңа дереккөз",
      "Основная ссылка для гостей внутри заведения": "Заведение ішіндегі қонақтарға негізгі сілтеме",
      "Ссылка в профиле": "Профильдегі сілтеме",
      "Гостиница": "Қонақүй",
      "Номера и гостевые зоны": "Нөмірлер және қонақ аймақтары",
      "Отдельный QR на столах": "Үстелдердегі бөлек QR",
      "Для разных форматов": "Әртүрлі форматтарға",
      "Продукт один. Сценарий зависит от заведения.": "Өнім бір. Сценарий заведениеге байланысты.",
      "Ресторан": "Ресторан",
      "Кофейня": "Кофейня",
      "Бар": "Бар",
      "Подключение": "Қосу",
      "От вашего меню до запуска — четыре понятных шага.": "Мәзіріңізден іске қосуға дейін төрт түсінікті қадам.",
      "Вы передаёте материалы": "Сіз материалдарды бересіз",
      "Меню, логотип и фотографии, которые уже есть у заведения.": "Заведениеде бар мәзір, логотип және фотолар.",
      "Exort собирает страницу": "Exort бетті жинайды",
      "Настраиваем структуру, стиль, языки и содержимое меню.": "Құрылым, стиль, тілдер және мәзір мазмұнын баптаймыз.",
      "Вы получаете доступ": "Сіз қолжетімділік аласыз",
      "Передаём QR-коды и рабочую админ-панель владельца.": "QR-кодтар мен жұмыс админ-панелін береміз.",
      "Управляете самостоятельно": "Өзіңіз басқарасыз",
      "После запуска меняете позиции, цены и доступность без разработчика.": "Іске қосқаннан кейін позиция, баға және қолжетімділікті әзірлеушісіз өзгертесіз.",
      "Один продукт. Два способа оплаты.": "Бір өнім. Екі төлем тәсілі.",
      "Помесячно": "Ай сайын",
      "/ месяц": "/ ай",
      "Минимальный срок — 3 месяца": "Ең аз мерзім - 3 ай",
      "Годовой план": "Жылдық жоспар",
      "в год": "жылына",
      "включено": "қосылған",
      "4 языка и автоматический перевод": "4 тіл және автоматты аударма",
      "Интеграции": "Интеграциялар",
      "Подключение r_keeper или iiko": "r_keeper немесе iiko қосу",
      "За дополнительную плату": "Қосымша ақыға",
      "Следующий шаг": "Келесі қадам",
      "Посмотрите гостевое меню. Возможности админ-панели показаны выше — доступ к ней получает только владелец после подключения.": "Қонақ мәзірін көріңіз. Админ-панель мүмкіндіктері жоғарыда көрсетілген — оған қолжетімділікті тек қосылғаннан кейін иесі алады.",
      "Написать в WhatsApp": "WhatsApp-қа жазу",
      "Цифровое меню · Управление · Аналитика · QR-источники": "Цифрлық мәзір · Басқару · Аналитика · QR-дереккөздер",
      "Цифровое меню как продукт заведения.": "Цифрлық мәзір - заведениенің өнімі.",
      "© Exort. Все данные на странице продукта демонстрационные.": "© Exort. Өнім бетіндегі барлық дерек демонстрациялық.",
    },
    en: {
      "Перейти к содержанию": "Skip to content",
      "Открыть демо": "Open demo",
      "Обсудить подключение": "Discuss setup",
      "Продукт": "Product",
      "Управление": "Management",
      "Аналитика": "Analytics",
      "Стоимость": "Pricing",
      "QR-коды": "QR codes",
      "Демо-меню": "Demo menu",
      "Демо-админка": "Demo admin",
      "Цифровое меню для заведений": "Digital menu for venues",
      "Меню становится": "The menu becomes the",
      "продуктом": "product",
      "заведения.": "of the venue.",
      "Exort создаёт цифровое меню под стиль заведения и даёт владельцу админ-панель, аналитику и отдельные QR-коды для разных точек входа.": "Exort creates a digital menu around the venue style and gives the owner an admin panel, analytics, and separate QR codes for every entry point.",
      "Посмотреть демо-меню": "View demo menu",
      "Как управляется меню": "How the menu is managed",
      "4 языка": "4 languages",
      "Без приложения": "No app",
      "открывается в браузере": "opens in the browser",
      "Живые изменения": "Live updates",
      "без перепечатки меню": "no menu reprints",
      "Один продукт, две стороны": "One product, two sides",
      "Красиво для гостя.": "Beautiful for guests.",
      "Понятно для владельца.": "Clear for owners.",
      "Гость быстро находит нужное. Команда заведения обновляет меню и видит интерес аудитории в одном рабочем пространстве.": "Guests find what they need quickly. The venue team updates the menu and sees audience interest in one workspace.",
      "Гость открывает QR": "Guest opens QR",
      "Без установки приложения и без тяжёлого PDF.": "No app install and no heavy PDF.",
      "Изучает живое меню": "Explores a live menu",
      "Категории, поиск, языки и подробные карточки блюд.": "Categories, search, languages, and detailed dish cards.",
      "Владелец видит интерес": "Owner sees interest",
      "Открытия, вовлечение, источники и динамика по времени.": "Opens, engagement, sources, and time dynamics.",
      "Меню для гостя": "Guest menu",
      "Не файл для просмотра. Интерфейс, которым удобно пользоваться.": "Not a file to browse. An interface people can actually use.",
      "Дизайн адаптируется под характер ресторана, кофейни, бара или гостиницы. Структура остаётся быстрой и понятной на любом телефоне.": "The design adapts to a restaurant, coffee shop, bar, or hotel. The structure stays fast and clear on any phone.",
      "Поиск и категории": "Search and categories",
      "Нужное блюдо находится за несколько касаний.": "The right dish is found in a few taps.",
      "Фото и подробная карточка": "Photo and detailed card",
      "Описание, цена, состав и доступность собраны вместе.": "Description, price, ingredients, and availability in one place.",
      "Переключение языка и автоматический перевод.": "Language switching and automatic translation.",
      "Стиль заведения": "Venue style",
      "Цвет, типографика и подача подстраиваются под бренд.": "Color, typography, and presentation adapt to the brand.",
      "Открыть живое демо": "Open live demo",
      "ПОИСК": "SEARCH",
      "4 ЯЗЫКА": "4 LANGUAGES",
      "Подробная карточка": "Detailed card",
      "Фисташковый раф": "Pistachio raf",
      "Эспрессо · молоко · фисташка": "Espresso · milk · pistachio",
      "Админ-панель владельца": "Owner admin panel",
      "Меню меняется тогда, когда это нужно заведению.": "The menu changes exactly when the venue needs it.",
      "Команда управляет содержанием самостоятельно и сразу видит результат на гостевой странице.": "The team manages content on its own and immediately sees the result on the guest page.",
      "Создавайте позиции": "Create items",
      "Название, описание, цена, вес и фотография.": "Name, description, price, weight, and photo.",
      "Управляйте структурой": "Manage structure",
      "Категории, порядок и временное скрытие.": "Categories, order, and temporary hiding.",
      "Включайте стоп-лист": "Use stop-list",
      "Недоступная позиция сразу меняет статус.": "Unavailable items change status immediately.",
      "Exort · управление меню": "Exort · menu management",
      "опубликовано": "published",
      "Проверяйте контент": "Check content",
      "Видно, где не хватает фото или перевода.": "See where a photo or translation is missing.",
      "Переводите автоматически": "Translate automatically",
      "Черновик перевода можно проверить перед публикацией.": "Review the translation draft before publishing.",
      "Смотрите предпросмотр": "Preview changes",
      "Изменения видны глазами гостя до запуска.": "See updates through the guest's eyes before launch.",
      "Открыть демо-админку": "Open demo admin",
      "Аналитика интереса": "Interest analytics",
      "Не догадки о меню, а понятные сигналы.": "Not menu guesses, but clear signals.",
      "Exort показывает открытия меню, вовлечение, интерес к позициям и источники переходов. Это не данные о заказах или выручке.": "Exort shows menu opens, engagement, item interest, and traffic sources. These are not order or revenue metrics.",
      "Последние 7 дней": "Last 7 days",
      "Сессии меню": "Menu sessions",
      "полноценные открытия": "full opens",
      "Вовлечённые гости": "Engaged guests",
      "открыли хотя бы одно блюдо": "opened at least one dish",
      "Открытия блюд": "Dish opens",
      "интерес к карточкам": "interest in cards",
      "Среднее изучение": "Avg. exploration",
      "на одну сессию": "per session",
      "Активность гостей": "Guest activity",
      "Сессии по дням": "Sessions by day",
      "+18% к прошлой неделе": "+18% vs last week",
      "Автоматические выводы": "Automatic insights",
      "Что стоит заметить": "Worth noticing",
      "В пятницу меню открывали на 34% чаще": "On Friday the menu opened 34% more often",
      "Пик интереса — с 18:00 до 21:00": "Peak interest is 18:00-21:00",
      "Фисташковый раф поднялся на второе место": "Pistachio raf moved into second place",
      "Рост открытий за последние семь дней": "Open growth over the last seven days",
      "Три позиции почти не открывают": "Three items are barely opened",
      "Стоит проверить фото, название или расположение": "Check the photo, name, or placement",
      "Интерес к позициям": "Item interest",
      "Популярные блюда": "Popular dishes",
      "Открытия": "Opens",
      "Дни и часы": "Days and hours",
      "Когда изучают меню": "When guests explore the menu",
      "Языки": "Languages",
      "Устройства": "Devices",
      "Главный источник": "Main source",
      "Главный зал": "Main hall",
      "сессий": "sessions",
      "QR-коды и источники": "QR codes and sources",
      "Каждая точка входа получает своё имя.": "Every entry point gets its own name.",
      "Один дизайн меню, разные QR-коды и ссылки. В аналитике видно, откуда открывали меню: из зала, Instagram, номера гостиницы или зоны ресепшен.": "One menu design, different QR codes and links. Analytics shows where the menu was opened from: hall, Instagram, hotel room, or reception area.",
      "Столы": "Tables",
      "Летняя терраса": "Summer terrace",
      "Гостиничные номера": "Hotel rooms",
      "Ресепшен": "Reception",
      "Вход": "Entrance",
      "Источники показывают переходы и вовлечение, а не покупки или выручку.": "Sources show visits and engagement, not purchases or revenue.",
      "Источники меню": "Menu sources",
      "7 активных": "7 active",
      "+ Новый источник": "+ New source",
      "Основная ссылка для гостей внутри заведения": "The main guest link inside the venue",
      "Ссылка в профиле": "Profile link",
      "Гостиница": "Hotel",
      "Номера и гостевые зоны": "Rooms and guest areas",
      "Отдельный QR на столах": "Separate QR on tables",
      "Для разных форматов": "For different formats",
      "Продукт один. Сценарий зависит от заведения.": "One product. The scenario depends on the venue.",
      "Ресторан": "Restaurant",
      "Кофейня": "Coffee shop",
      "Бар": "Bar",
      "Подключение": "Setup",
      "От вашего меню до запуска — четыре понятных шага.": "From your menu to launch in four clear steps.",
      "Вы передаёте материалы": "You send materials",
      "Меню, логотип и фотографии, которые уже есть у заведения.": "The menu, logo, and photos the venue already has.",
      "Exort собирает страницу": "Exort builds the page",
      "Настраиваем структуру, стиль, языки и содержимое меню.": "We set up structure, style, languages, and menu content.",
      "Вы получаете доступ": "You get access",
      "Передаём QR-коды и рабочую админ-панель владельца.": "We hand over QR codes and the working owner admin panel.",
      "Управляете самостоятельно": "You manage it yourself",
      "После запуска меняете позиции, цены и доступность без разработчика.": "After launch, you change items, prices, and availability without a developer.",
      "Один продукт. Два способа оплаты.": "One product. Two payment options.",
      "Помесячно": "Monthly",
      "/ месяц": "/ month",
      "Минимальный срок — 3 месяца": "Minimum term - 3 months",
      "Годовой план": "Annual plan",
      "в год": "per year",
      "включено": "included",
      "4 языка и автоматический перевод": "4 languages and automatic translation",
      "Интеграции": "Integrations",
      "Подключение r_keeper или iiko": "r_keeper or iiko connection",
      "За дополнительную плату": "For an additional fee",
      "Следующий шаг": "Next step",
      "Посмотрите гостевое меню. Возможности админ-панели показаны выше — доступ к ней получает только владелец после подключения.": "Explore the guest menu. The admin panel capabilities are shown above; access is provided only to the owner after onboarding.",
      "Написать в WhatsApp": "Write on WhatsApp",
      "Цифровое меню · Управление · Аналитика · QR-источники": "Digital menu · Management · Analytics · QR sources",
      "Цифровое меню как продукт заведения.": "A digital menu as a venue product.",
      "© Exort. Все данные на странице продукта демонстрационные.": "© Exort. All data on this product page is fictional demo data.",
    },
    tr: {
      "Перейти к содержанию": "İçeriğe geç",
      "Открыть демо": "Demoyu aç",
      "Обсудить подключение": "Kurulumu görüş",
      "Продукт": "Ürün",
      "Управление": "Yönetim",
      "Аналитика": "Analiz",
      "Стоимость": "Fiyatlandırma",
      "QR-коды": "QR kodları",
      "Демо-меню": "Demo menü",
      "Демо-админка": "Demo yönetim paneli",
      "Цифровое меню для заведений": "İşletmeler için dijital menü",
      "Меню становится": "Menü işletmenin",
      "продуктом": "ürününe",
      "заведения.": "dönüşür.",
      "Exort создаёт цифровое меню под стиль заведения и даёт владельцу админ-панель, аналитику и отдельные QR-коды для разных точек входа.": "Exort, işletmenin tarzına uygun dijital bir menü oluşturur; işletme sahibine yönetim paneli, analizler ve farklı giriş noktaları için ayrı QR kodları sunar.",
      "Посмотреть демо-меню": "Demo menüyü görüntüle",
      "Как управляется меню": "Menü nasıl yönetilir",
      "4 языка": "4 dil",
      "Без приложения": "Uygulamasız",
      "открывается в браузере": "tarayıcıda açılır",
      "Живые изменения": "Anlık değişiklikler",
      "без перепечатки меню": "menüyü yeniden basmadan",
      "Один продукт, две стороны": "Tek ürün, iki yüz",
      "Красиво для гостя.": "Misafir için şık.",
      "Понятно для владельца.": "İşletme sahibi için anlaşılır.",
      "Гость быстро находит нужное. Команда заведения обновляет меню и видит интерес аудитории в одном рабочем пространстве.": "Misafir aradığını hızla bulur. İşletme ekibi menüyü günceller ve ziyaretçi ilgisini tek bir çalışma alanında görür.",
      "Гость открывает QR": "Misafir QR kodunu açar",
      "Без установки приложения и без тяжёлого PDF.": "Uygulama yüklemeden ve ağır PDF dosyaları olmadan.",
      "Изучает живое меню": "Canlı menüyü inceler",
      "Категории, поиск, языки и подробные карточки блюд.": "Kategoriler, arama, diller ve ayrıntılı ürün kartları.",
      "Владелец видит интерес": "İşletme sahibi ilgiyi görür",
      "Открытия, вовлечение, источники и динамика по времени.": "Açılışlar, etkileşim, kaynaklar ve zamana göre değişim.",
      "Меню для гостя": "Misafir menüsü",
      "Не файл для просмотра. Интерфейс, которым удобно пользоваться.": "Görüntülenecek bir dosya değil. Kullanımı kolay bir arayüz.",
      "Дизайн адаптируется под характер ресторана, кофейни, бара или гостиницы. Структура остаётся быстрой и понятной на любом телефоне.": "Tasarım; restoranın, kafenin, barın veya otelin karakterine uyarlanır. Yapı her telefonda hızlı ve anlaşılır kalır.",
      "Поиск и категории": "Arama ve kategoriler",
      "Нужное блюдо находится за несколько касаний.": "Aranan ürün birkaç dokunuşla bulunur.",
      "Фото и подробная карточка": "Fotoğraf ve ayrıntılı kart",
      "Описание, цена, состав и доступность собраны вместе.": "Açıklama, fiyat, içerik ve bulunabilirlik tek yerde.",
      "Переключение языка и автоматический перевод.": "Dil değiştirme ve otomatik çeviri.",
      "Стиль заведения": "İşletmenin tarzı",
      "Цвет, типографика и подача подстраиваются под бренд.": "Renk, tipografi ve sunum markaya uyarlanır.",
      "Открыть живое демо": "Canlı demoyu aç",
      "ПОИСК": "ARAMA",
      "4 ЯЗЫКА": "4 DİL",
      "Подробная карточка": "Ayrıntılı kart",
      "Фисташковый раф": "Antep fıstıklı raf",
      "Эспрессо · молоко · фисташка": "Espresso · süt · Antep fıstığı",
      "Админ-панель владельца": "İşletme sahibi yönetim paneli",
      "Меню меняется тогда, когда это нужно заведению.": "Menü, işletmenin ihtiyaç duyduğu anda değişir.",
      "Команда управляет содержанием самостоятельно и сразу видит результат на гостевой странице.": "Ekip içeriği kendi yönetir ve sonucu misafir sayfasında anında görür.",
      "Создавайте позиции": "Ürün ekleyin",
      "Название, описание, цена, вес и фотография.": "Ad, açıklama, fiyat, gramaj ve fotoğraf.",
      "Управляйте структурой": "Yapıyı yönetin",
      "Категории, порядок и временное скрытие.": "Kategoriler, sıralama ve geçici gizleme.",
      "Включайте стоп-лист": "Stok dışı listesini kullanın",
      "Недоступная позиция сразу меняет статус.": "Mevcut olmayan ürünün durumu anında değişir.",
      "Exort · управление меню": "Exort · menü yönetimi",
      "опубликовано": "yayında",
      "Проверяйте контент": "İçeriği kontrol edin",
      "Видно, где не хватает фото или перевода.": "Eksik fotoğraf veya çeviri olan yerler görünür.",
      "Переводите автоматически": "Otomatik çevirin",
      "Черновик перевода можно проверить перед публикацией.": "Çeviri taslağı yayımlanmadan önce kontrol edilebilir.",
      "Смотрите предпросмотр": "Önizlemeyi inceleyin",
      "Изменения видны глазами гостя до запуска.": "Değişiklikler yayına alınmadan önce misafirin göreceği şekilde incelenir.",
      "Открыть демо-админку": "Demo yönetim panelini aç",
      "Аналитика интереса": "İlgi analizi",
      "Не догадки о меню, а понятные сигналы.": "Menü hakkında tahminler değil, anlaşılır sinyaller.",
      "Exort показывает открытия меню, вовлечение, интерес к позициям и источники переходов. Это не данные о заказах или выручке.": "Exort; menü açılışlarını, etkileşimi, ürünlere ilgiyi ve ziyaret kaynaklarını gösterir. Bunlar sipariş veya ciro verileri değildir.",
      "Последние 7 дней": "Son 7 gün",
      "Сессии меню": "Menü oturumları",
      "полноценные открытия": "tam açılışlar",
      "Вовлечённые гости": "Etkileşime geçen misafirler",
      "открыли хотя бы одно блюдо": "en az bir ürün açtı",
      "Открытия блюд": "Ürün açılışları",
      "интерес к карточкам": "ürün kartlarına ilgi",
      "Среднее изучение": "Ortalama inceleme",
      "на одну сессию": "oturum başına",
      "Активность гостей": "Misafir etkinliği",
      "Сессии по дням": "Günlere göre oturumlar",
      "+18% к прошлой неделе": "geçen haftaya göre +%18",
      "Автоматические выводы": "Otomatik içgörüler",
      "Что стоит заметить": "Dikkat edilmesi gerekenler",
      "В пятницу меню открывали на 34% чаще": "Cuma günü menü %34 daha fazla açıldı",
      "Пик интереса — с 18:00 до 21:00": "İlgi zirvesi 18.00–21.00 arasında",
      "Фисташковый раф поднялся на второе место": "Antep fıstıklı raf ikinci sıraya yükseldi",
      "Рост открытий за последние семь дней": "Son yedi günde açılış artışı",
      "Три позиции почти не открывают": "Üç ürün neredeyse hiç açılmıyor",
      "Стоит проверить фото, название или расположение": "Fotoğrafı, adı veya sıralamayı kontrol etmekte fayda var",
      "Интерес к позициям": "Ürünlere ilgi",
      "Популярные блюда": "Popüler ürünler",
      "Открытия": "Açılışlar",
      "Дни и часы": "Günler ve saatler",
      "Когда изучают меню": "Menü ne zaman inceleniyor",
      "Языки": "Diller",
      "Устройства": "Cihazlar",
      "Главный источник": "Ana kaynak",
      "Главный зал": "Ana salon",
      "сессий": "oturum",
      "QR-коды и источники": "QR kodları ve kaynaklar",
      "Каждая точка входа получает своё имя.": "Her giriş noktası kendi adını alır.",
      "Один дизайн меню, разные QR-коды и ссылки. В аналитике видно, откуда открывали меню: из зала, Instagram, номера гостиницы или зоны ресепшен.": "Tek menü tasarımı, farklı QR kodları ve bağlantılar. Analizlerde menünün salondan, Instagram'dan, otel odasından veya resepsiyon alanından nerede açıldığı görülür.",
      "Столы": "Masalar",
      "Летняя терраса": "Yaz terası",
      "Гостиничные номера": "Otel odaları",
      "Ресепшен": "Resepsiyon",
      "Вход": "Giriş",
      "Источники показывают переходы и вовлечение, а не покупки или выручку.": "Kaynaklar satın alma veya ciroyu değil, ziyaretleri ve etkileşimi gösterir.",
      "Источники меню": "Menü kaynakları",
      "7 активных": "7 aktif",
      "+ Новый источник": "+ Yeni kaynak",
      "Основная ссылка для гостей внутри заведения": "İşletme içindeki misafirler için ana bağlantı",
      "Ссылка в профиле": "Profil bağlantısı",
      "Гостиница": "Otel",
      "Номера и гостевые зоны": "Odalar ve misafir alanları",
      "Отдельный QR на столах": "Masalarda ayrı QR kodu",
      "Для разных форматов": "Farklı işletme türleri için",
      "Продукт один. Сценарий зависит от заведения.": "Ürün tek. Kullanım senaryosu işletmeye göre değişir.",
      "Ресторан": "Restoran",
      "Кофейня": "Kafe",
      "Бар": "Bar",
      "Подключение": "Kurulum",
      "От вашего меню до запуска — четыре понятных шага.": "Menünüzden yayına kadar dört anlaşılır adım.",
      "Вы передаёте материалы": "Materyalleri iletirsiniz",
      "Меню, логотип и фотографии, которые уже есть у заведения.": "İşletmede mevcut olan menü, logo ve fotoğraflar.",
      "Exort собирает страницу": "Exort sayfayı hazırlar",
      "Настраиваем структуру, стиль, языки и содержимое меню.": "Menünün yapısını, tarzını, dillerini ve içeriğini ayarlarız.",
      "Вы получаете доступ": "Erişim sağlanır",
      "Передаём QR-коды и рабочую админ-панель владельца.": "QR kodlarını ve çalışan yönetim panelini işletme sahibine teslim ederiz.",
      "Управляете самостоятельно": "Kendiniz yönetirsiniz",
      "После запуска меняете позиции, цены и доступность без разработчика.": "Yayından sonra ürünleri, fiyatları ve bulunabilirliği geliştirici olmadan değiştirirsiniz.",
      "Один продукт. Два способа оплаты.": "Tek ürün. İki ödeme seçeneği.",
      "Помесячно": "Aylık",
      "/ месяц": "/ ay",
      "Минимальный срок — 3 месяца": "Minimum süre 3 ay",
      "Годовой план": "Yıllık plan",
      "в год": "yıllık",
      "включено": "dahil",
      "4 языка и автоматический перевод": "4 dil ve otomatik çeviri",
      "Интеграции": "Entegrasyonlar",
      "Подключение r_keeper или iiko": "r_keeper veya iiko bağlantısı",
      "За дополнительную плату": "Ek ücret karşılığında",
      "Следующий шаг": "Sonraki adım",
      "Посмотрите гостевое меню. Возможности админ-панели показаны выше — доступ к ней получает только владелец после подключения.": "Misafir menüsünü inceleyin. Yönetim panelinin özellikleri yukarıda gösterilmiştir; panele yalnızca kurulumdan sonra işletme sahibi erişir.",
      "Написать в WhatsApp": "WhatsApp'tan yazın",
      "Цифровое меню · Управление · Аналитика · QR-источники": "Dijital menü · Yönetim · Analiz · QR kaynakları",
      "Цифровое меню как продукт заведения.": "İşletmenin ürünü olarak dijital menü.",
      "01 · РЕСТОРАН": "01 · RESTORAN",
      "02 · КОФЕЙНЯ": "02 · KAFE",
      "03 · БАР": "03 · BAR",
      "04 · ГОСТИНИЦА": "04 · OTEL",
      "280 000 ₸ в год": "Yıllık 280.000 ₸",
      "326 сессий": "326 oturum",
      "326 сессий · demo": "326 oturum · demo",
      "DEMO-ДАННЫЕ · период 7 дней": "DEMO VERİLERİ · 7 günlük dönem",
      "Exort — цифровое меню как продукт заведения": "Exort — işletmenin ürünü olarak dijital menü",
      "Exort · ПОДКЛЮЧЕНИЕ": "Exort · KURULUM",
      "Instagram-ссылка": "Instagram bağlantısı",
      "QR по зонам": "Alanlara göre QR",
      "QR по номерам и зонам": "Odalara ve alanlara göre QR",
      "QR-ИСТОЧНИКИ": "QR KAYNAKLARI",
      "QR-КОД · DEMO": "QR KODU · DEMO",
      "Автоперевод": "Otomatik çeviri",
      "Админ-панель и стоп-лист": "Yönetim paneli ve stok dışı listesi",
      "Активность · 7 дней": "Etkinlik · 7 gün",
      "Аналитика и QR-источники": "Analizler ve QR kaynakları",
      "Аналитика по времени": "Zamana göre analiz",
      "Быстрое меню с акцентом на новинки, сезонные напитки и завтраки.": "Yeni ürünleri, mevsimlik içecekleri ve kahvaltıları öne çıkaran hızlı bir menü.",
      "Вс": "Paz",
      "Все источники": "Tüm kaynaklar",
      "Все показатели и названия в блоке аналитики демонстрационные и не относятся к реальному клиенту.": "Analiz bölümündeki tüm göstergeler ve adlar kurgusaldır; gerçek bir müşteriye ait değildir.",
      "Вт": "Sal",
      "Годовой план оплачивается за 12 месяцев. Дополнительная скидка": "Yıllık plan 12 aylık olarak ödenir. Ek indirim",
      "ДЕМО-ДАННЫЕ": "DEMO VERİLERİ",
      "Демонстрационный интерфейс. Все названия и значения вымышлены.": "Demo arayüzü. Tüm adlar ve değerler kurgusaldır.",
      "для ресторанов, кофеен, баров и гостиниц": "restoranlar, kafeler, barlar ve oteller için",
      "Завтраки": "Kahvaltılar",
      "Информация для гостей": "Misafir bilgileri",
      "Источник": "Kaynak",
      "Карточки напитков": "İçecek kartları",
      "Категории и фильтры": "Kategoriler ve filtreler",
      "Категории, фотографии, несколько языков и источники для залов или столов.": "Kategoriler, fotoğraflar, birden fazla dil ve salonlar ya da masalar için kaynaklar.",
      "Коктейльная карта": "Kokteyl menüsü",
      "Коктейльная карта, винная подборка и позиции, которые меняются вечером.": "Kokteyl menüsü, şarap seçkisi ve akşam değişen ürünler.",
      "Круассан с лососем": "Somonlu kruvasan",
      "Летний ягодный боул": "Yaz meyveli bowl",
      "Меню": "Menü",
      "Меню для гостей": "Misafir menüsü",
      "Меню ресторана": "Restoran menüsü",
      "Меню ресторана и завтраков плюс понятная информация для гостей.": "Restoran ve kahvaltı menüsünün yanında misafirler için anlaşılır bilgiler.",
      "Основное меню, сезонные предложения и стоп-лист без перепечатки.": "Ana menü, mevsimlik teklifler ve yeniden baskı gerektirmeyen stok dışı listesi.",
      "Отдельные QR-коды для номеров, ресепшен, ресторана и других зон.": "Odalar, resepsiyon, restoran ve diğer alanlar için ayrı QR kodları.",
      "открытий на 34% больше": "%34 daha fazla açılış",
      "Пн": "Pzt",
      "Покажите гостю меню, которое соответствует вашему заведению.": "Misafirinize işletmenize yakışan bir menü gösterin.",
      "Понятная мобильная подача и быстрые изменения цены или доступности.": "Anlaşılır mobil sunum ve fiyat ya da bulunabilirlikte hızlı değişiklikler.",
      "Пт": "Cum",
      "Сб": "Cmt",
      "Сезонное меню": "Mevsimlik menü",
      "сессии": "oturum",
      "сессия": "oturum",
      "Ср": "Çar",
      "Стоп-лист": "Stok dışı listesi",
      "Тирамису MORI": "MORI tiramisu",
      "уже учтена в итоговой сумме.": "nihai tutara zaten dahil edilmiştir.",
      "УПРАВЛЕНИЕ ДЛЯ ВЛАДЕЛЬЦА": "İŞLETME SAHİBİ İÇİN YÖNETİM",
      "Фильтры, описания вкуса и оперативное управление стоп-листом.": "Filtreler, lezzet açıklamaları ve stok dışı listesinin hızlı yönetimi.",
      "Функции остаются одинаковыми. Годовой вариант снижает ежемесячную стоимость и даёт дополнительную скидку.": "Özellikler aynıdır. Yıllık seçenek aylık maliyeti düşürür ve ek indirim sağlar.",
      "Цифровое меню для гостей": "Misafirler için dijital menü",
      "Чт": "Per",
      "Exort, наверх": "Exort, yukarı dön",
      "Админ-панель Exort для управления блюдами и стоп-листом": "Ürünleri ve stok dışı listesini yönetmek için Exort paneli",
      "Возможности Exort": "Exort özellikleri",
      "Выбор языка": "Dil seçimi",
      "Демонстрационная аналитика": "Demo analizleri",
      "Демонстрационная кнопка создания источника": "Demo kaynak oluşturma düğmesi",
      "Демонстрационная тепловая карта активности": "Demo etkinlik ısı haritası",
      "Демонстрационное меню ресторана на экране телефона": "Telefon ekranında demo restoran menüsü",
      "Демонстрационное мобильное меню Exort": "Exort demo mobil menüsü",
      "Демонстрационный график активности по дням": "Günlere göre demo etkinlik grafiği",
      "Демонстрационный источник QR-кода": "Demo QR kodu kaynağı",
      "Демонстрационный, нерабочий QR-код": "Kurgusal ve çalışmayan demo QR kodu",
      "Интерфейсы продукта Exort": "Exort ürün arayüzleri",
      "Мобильная навигация": "Mobil gezinme",
      "Мобильное меню Exort": "Exort mobil menüsü",
      "Основная навигация": "Ana gezinme",
      "Примеры источников": "Kaynak örnekleri",
      "Ссылки в подвале": "Alt bilgi bağlantıları",
      "Тип заведения": "İşletme türü",
      "© Exort. Все данные на странице продукта демонстрационные.": "© Exort. Ürün sayfasındaki tüm veriler kurgusal demo verileridir.",
    },
  };

  let reducedMotion = reducedMotionQuery.matches;
  let currentLanguage = getStoredLanguage();
  let scrollFrame = 0;
  let heroTypewriterTimer = 0;
  let heroTypewriterActive = false;
  const originalText = new WeakMap();
  const originalAttribute = new WeakMap();

  function getStoredLanguage() {
    try {
      const requested = new URLSearchParams(window.location.search).get("lang") || localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return SUPPORTED_LANGUAGES.includes(requested) ? requested : "ru";
    } catch {
      return "ru";
    }
  }

  function translateValue(value, language) {
    if (language === "ru") return value;
    return LANGUAGE_COPY[language]?.[value] || value;
  }

  function updateLanguageButtons(language) {
    languageButtons.forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function cacheAttribute(element, attribute) {
    let cache = originalAttribute.get(element);
    if (!cache) {
      cache = {};
      originalAttribute.set(element, cache);
    }
    if (!(attribute in cache)) cache[attribute] = element.getAttribute(attribute);
    return cache[attribute];
  }

  function applyLanguage(language) {
    currentLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : "ru";
    document.documentElement.lang = currentLanguage === "kk" ? "kk" : currentLanguage;
    document.body.dataset.language = currentLanguage;
    updateLanguageButtons(currentLanguage);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    } catch {}

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue);
      const source = originalText.get(node);
      const token = source.replace(/\s+/g, " ").trim();
      const translated = translateValue(token, currentLanguage);
      node.nodeValue = token === translated ? source : source.replace(token, translated);
    }

    document.querySelectorAll("[aria-label], img[alt]").forEach((element) => {
      ["aria-label", "alt"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        const source = cacheAttribute(element, attribute);
        element.setAttribute(attribute, translateValue(source, currentLanguage));
      });
    });

    document.title = currentLanguage === "ru"
      ? "Exort — цифровое меню как продукт заведения"
      : currentLanguage === "kk"
        ? "Exort — цифрлық мәзір заведениенің өнімі ретінде"
        : currentLanguage === "tr"
          ? "Exort — işletmenin ürünü olarak dijital menü"
          : "Exort — a digital menu as a venue product";
  }

  function syncHeroTypewriterAccessibility() {
    const heading = document.querySelector("[data-typewriter]");
    if (!heading) return;
    const parts = Array.from(heading.querySelectorAll("[data-typewriter-part]"));
    const label = parts.map((part) => part.textContent.trim()).filter(Boolean).join(" ");
    if (label) heading.setAttribute("aria-label", label);
    parts.forEach((part) => part.setAttribute("aria-hidden", "true"));
  }

  function finishHeroTypewriter() {
    window.clearTimeout(heroTypewriterTimer);
    heroTypewriterTimer = 0;
    heroTypewriterActive = false;
    const heading = document.querySelector("[data-typewriter]");
    if (!heading) return;
    heading.classList.remove("is-typing");
    heading.classList.add("is-typed");
    heading.style.minHeight = "";
    syncHeroTypewriterAccessibility();
  }

  function initializeHeroTypewriter() {
    const heading = document.querySelector("[data-typewriter]");
    if (!heading) return;
    const parts = Array.from(heading.querySelectorAll("[data-typewriter-part]"));
    const characters = parts.map((part) => Array.from(part.textContent));
    syncHeroTypewriterAccessibility();

    if (reducedMotion || !characters.some((part) => part.length)) {
      heading.classList.add("is-typed");
      return;
    }

    heading.style.minHeight = `${Math.ceil(heading.getBoundingClientRect().height)}px`;
    parts.forEach((part) => { part.textContent = ""; });
    heading.classList.add("is-typing");
    heroTypewriterActive = true;
    let partIndex = 0;
    let characterIndex = 0;

    const typeNextCharacter = () => {
      if (!heroTypewriterActive) return;
      if (partIndex >= parts.length) {
        finishHeroTypewriter();
        return;
      }

      if (characterIndex < characters[partIndex].length) {
        parts[partIndex].textContent += characters[partIndex][characterIndex];
        characterIndex += 1;
        heroTypewriterTimer = window.setTimeout(typeNextCharacter, partIndex === 1 ? 58 : 46);
        return;
      }

      partIndex += 1;
      characterIndex = 0;
      heroTypewriterTimer = window.setTimeout(typeNextCharacter, 90);
    };

    heroTypewriterTimer = window.setTimeout(typeNextCharacter, 320);
  }

  function updateHeader() {
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
    scrollFrame = 0;
  }

  function requestHeaderUpdate() {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateHeader);
  }

  function setMenu(open) {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    mobileNav.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("nav-open", open);
  }

  menuToggle?.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  mobileNav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) setMenu(false);
  }, { passive: true });

  function initializeReveals() {
    const elements = Array.from(document.querySelectorAll(".reveal"));
    elements.forEach((element, index) => element.style.setProperty("--delay", `${Math.min(index % 4, 3) * 65}ms`));

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.13, rootMargin: "0px 0px -55px" },
    );

    elements.forEach((element) => observer.observe(element));
  }

  function formatCounter(value, element) {
    if (element.dataset.duration === "true") {
      const minutes = Math.floor(value / 60);
      const seconds = Math.round(value % 60).toString().padStart(2, "0");
      return `${minutes}:${seconds}`;
    }
    return `${Math.round(value).toLocaleString(LANGUAGE_LOCALES[currentLanguage] || "ru-RU")}${element.dataset.suffix || ""}`;
  }

  function animateCounter(element) {
    const target = Number(element.dataset.count || 0);
    if (!Number.isFinite(target)) return;

    if (reducedMotion) {
      element.textContent = formatCounter(target, element);
      return;
    }

    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatCounter(target * eased, element);
      if (progress < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }

  function initializeProductAnimations() {
    const analytics = document.querySelector("[data-analytics-demo]");
    const sources = document.querySelector("[data-source-console]");
    const targets = [analytics, sources].filter(Boolean);

    if (reducedMotion || !("IntersectionObserver" in window)) {
      analytics?.classList.add("is-animated");
      sources?.classList.add("is-animated");
      analytics?.querySelectorAll("[data-count]").forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-animated");
          entry.target.querySelectorAll("[data-count]").forEach(animateCounter);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -28px" },
    );

    targets.forEach((target) => observer.observe(target));
  }

  function selectVenue(button, focus = false) {
    const tabsRoot = button.closest("[data-venue-tabs]");
    const venue = button.dataset.venue;
    if (!tabsRoot || !venue) return;

    tabsRoot.querySelectorAll("[role='tab']").forEach((tab) => {
      const active = tab === button;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    tabsRoot.querySelectorAll("[data-venue-panel]").forEach((panel) => {
      const active = panel.dataset.venuePanel === venue;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });

    if (focus) button.focus();
  }

  document.querySelectorAll("[data-venue-tabs]").forEach((tabsRoot) => {
    const tabs = Array.from(tabsRoot.querySelectorAll("[role='tab']"));
    tabs.forEach((tab, index) => {
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
      tab.addEventListener("click", () => selectVenue(tab));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        selectVenue(tabs[nextIndex], true);
      });
    });
  });

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (heroTypewriterActive) {
        window.clearTimeout(heroTypewriterTimer);
        heroTypewriterActive = false;
      }
      applyLanguage(button.dataset.language);
      finishHeroTypewriter();
    });
  });

  function initializeSectionNavigation() {
    if (!("IntersectionObserver" in window)) return;
    const navLinks = Array.from(document.querySelectorAll(".desktop-nav a[href^='#']"));
    const targets = navLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`));
      },
      { rootMargin: "-20% 0px -66%", threshold: [0.02, 0.2] },
    );

    targets.forEach((target) => observer.observe(target));
  }

  reducedMotionQuery.addEventListener?.("change", (event) => {
    reducedMotion = event.matches;
  });

  window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
  applyLanguage(currentLanguage);
  initializeHeroTypewriter();
  updateHeader();
  initializeReveals();
  initializeProductAnimations();
  initializeSectionNavigation();
})();
