(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const languageButtons = Array.from(document.querySelectorAll("[data-language]"));
  const LANGUAGE_STORAGE_KEY = "exort-new-language";
  const SUPPORTED_LANGUAGES = ["ru", "kk", "en", "uz"];
  const LANGUAGE_LOCALES = {
    ru: "ru-RU",
    kk: "kk-KZ",
    en: "en-US",
    uz: "uz-UZ",
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
    uz: {
      "Перейти к содержанию": "Kontentga o'tish",
      "Открыть демо": "Demoni ochish",
      "Обсудить подключение": "Ulanishni muhokama qilish",
      "Продукт": "Mahsulot",
      "Управление": "Boshqaruv",
      "Аналитика": "Analitika",
      "Стоимость": "Narx",
      "QR-коды": "QR-kodlar",
      "Демо-меню": "Demo menyu",
      "Демо-админка": "Demo admin",
      "Цифровое меню для заведений": "Muassasalar uchun raqamli menyu",
      "Меню становится": "Menyu muassasaning",
      "продуктом": "mahsulotiga",
      "заведения.": "aylanadi.",
      "Exort создаёт цифровое меню под стиль заведения и даёт владельцу админ-панель, аналитику и отдельные QR-коды для разных точек входа.": "Exort muassasa uslubiga mos raqamli menyu yaratadi va egasiga admin-panel, analitika hamda har bir kirish nuqtasi uchun alohida QR-kod beradi.",
      "Посмотреть демо-меню": "Demo menyuni ko'rish",
      "Как управляется меню": "Menyu qanday boshqariladi",
      "4 языка": "4 til",
      "Без приложения": "Ilovasiz",
      "открывается в браузере": "brauzerda ochiladi",
      "Живые изменения": "Jonli o'zgarishlar",
      "без перепечатки меню": "menyuni qayta chop etmasdan",
      "Один продукт, две стороны": "Bitta mahsulot, ikki tomon",
      "Красиво для гостя.": "Mehmon uchun chiroyli.",
      "Понятно для владельца.": "Ega uchun tushunarli.",
      "Гость быстро находит нужное. Команда заведения обновляет меню и видит интерес аудитории в одном рабочем пространстве.": "Mehmon kerakli narsani tez topadi. Jamoa menyuni yangilaydi va auditoriya qiziqishini bitta ish maydonida ko'radi.",
      "Гость открывает QR": "Mehmon QR ochadi",
      "Без установки приложения и без тяжёлого PDF.": "Ilova o'rnatmasdan va og'ir PDF-siz.",
      "Изучает живое меню": "Jonli menyuni ko'radi",
      "Категории, поиск, языки и подробные карточки блюд.": "Kategoriyalar, qidiruv, tillar va batafsil taom kartalari.",
      "Владелец видит интерес": "Ega qiziqishni ko'radi",
      "Открытия, вовлечение, источники и динамика по времени.": "Ochishlar, jalb etilish, manbalar va vaqt bo'yicha dinamika.",
      "Меню для гостя": "Mehmon menyusi",
      "Не файл для просмотра. Интерфейс, которым удобно пользоваться.": "Ko'rish uchun fayl emas. Foydalanishga qulay interfeys.",
      "Дизайн адаптируется под характер ресторана, кофейни, бара или гостиницы. Структура остаётся быстрой и понятной на любом телефоне.": "Dizayn restoran, kofe joyi, bar yoki mehmonxona xarakteriga moslashadi. Tuzilma har qanday telefonda tez va tushunarli qoladi.",
      "Поиск и категории": "Qidiruv va kategoriyalar",
      "Нужное блюдо находится за несколько касаний.": "Kerakli taom bir necha bosishda topiladi.",
      "Фото и подробная карточка": "Foto va batafsil karta",
      "Описание, цена, состав и доступность собраны вместе.": "Tavsif, narx, tarkib va mavjudlik bir joyda.",
      "Переключение языка и автоматический перевод.": "Tilni almashtirish va avtomatik tarjima.",
      "Стиль заведения": "Muassasa uslubi",
      "Цвет, типографика и подача подстраиваются под бренд.": "Rang, tipografika va taqdimot brendga moslashadi.",
      "Открыть живое демо": "Jonli demoni ochish",
      "ПОИСК": "QIDIRUV",
      "4 ЯЗЫКА": "4 TIL",
      "Подробная карточка": "Batafsil karta",
      "Фисташковый раф": "Pistachio raf",
      "Эспрессо · молоко · фисташка": "Espresso · sut · pistachio",
      "Админ-панель владельца": "Ega admin-paneli",
      "Меню меняется тогда, когда это нужно заведению.": "Menyu muassasaga kerak bo'lgan paytda o'zgaradi.",
      "Команда управляет содержанием самостоятельно и сразу видит результат на гостевой странице.": "Jamoa kontentni o'zi boshqaradi va natijani mehmon sahifasida darhol ko'radi.",
      "Создавайте позиции": "Pozitsiyalar yarating",
      "Название, описание, цена, вес и фотография.": "Nomi, tavsifi, narxi, vazni va fotosi.",
      "Управляйте структурой": "Tuzilmani boshqaring",
      "Категории, порядок и временное скрытие.": "Kategoriyalar, tartib va vaqtincha yashirish.",
      "Включайте стоп-лист": "Stop-listni yoqing",
      "Недоступная позиция сразу меняет статус.": "Mavjud bo'lmagan pozitsiya statusni darhol o'zgartiradi.",
      "Exort · управление меню": "Exort · menyu boshqaruvi",
      "опубликовано": "e'lon qilingan",
      "Проверяйте контент": "Kontentni tekshiring",
      "Видно, где не хватает фото или перевода.": "Qayerda foto yoki tarjima yetishmasligi ko'rinadi.",
      "Переводите автоматически": "Avtomatik tarjima qiling",
      "Черновик перевода можно проверить перед публикацией.": "Tarjima qoralamasini e'lon qilishdan oldin tekshirish mumkin.",
      "Смотрите предпросмотр": "Oldindan ko'ring",
      "Изменения видны глазами гостя до запуска.": "Ishga tushirishdan oldin o'zgarishlar mehmon ko'zi bilan ko'rinadi.",
      "Открыть демо-админку": "Demo adminni ochish",
      "Аналитика интереса": "Qiziqish analitikasi",
      "Не догадки о меню, а понятные сигналы.": "Menyu haqida taxmin emas, aniq signallar.",
      "Exort показывает открытия меню, вовлечение, интерес к позициям и источники переходов. Это не данные о заказах или выручке.": "Exort menyu ochishlari, jalb etilish, pozitsiyalarga qiziqish va o'tish manbalarini ko'rsatadi. Bu buyurtma yoki tushum ma'lumotlari emas.",
      "Последние 7 дней": "So'nggi 7 kun",
      "Сессии меню": "Menyu sessiyalari",
      "полноценные открытия": "to'liq ochishlar",
      "Вовлечённые гости": "Jalb qilingan mehmonlar",
      "открыли хотя бы одно блюдо": "kamida bitta taomni ochdi",
      "Открытия блюд": "Taom ochishlari",
      "интерес к карточкам": "kartalarga qiziqish",
      "Среднее изучение": "O'rtacha ko'rish",
      "на одну сессию": "bir sessiyaga",
      "Активность гостей": "Mehmon faolligi",
      "Сессии по дням": "Kunlar bo'yicha sessiyalar",
      "+18% к прошлой неделе": "o'tgan haftaga nisbatan +18%",
      "Автоматические выводы": "Avtomatik xulosalar",
      "Что стоит заметить": "Nimaga e'tibor berish kerak",
      "В пятницу меню открывали на 34% чаще": "Juma kuni menyu 34% ko'proq ochildi",
      "Пик интереса — с 18:00 до 21:00": "Qiziqish cho'qqisi 18:00-21:00",
      "Фисташковый раф поднялся на второе место": "Pistachio raf ikkinchi o'ringa chiqdi",
      "Рост открытий за последние семь дней": "So'nggi yetti kunda ochishlar o'sdi",
      "Три позиции почти не открывают": "Uch pozitsiya deyarli ochilmaydi",
      "Стоит проверить фото, название или расположение": "Foto, nom yoki joylashuvni tekshirish kerak",
      "Интерес к позициям": "Pozitsiyalarga qiziqish",
      "Популярные блюда": "Mashhur taomlar",
      "Открытия": "Ochishlar",
      "Дни и часы": "Kunlar va soatlar",
      "Когда изучают меню": "Menyu qachon ko'riladi",
      "Языки": "Tillar",
      "Устройства": "Qurilmalar",
      "Главный источник": "Asosiy manba",
      "Главный зал": "Asosiy zal",
      "сессий": "sessiya",
      "QR-коды и источники": "QR-kodlar va manbalar",
      "Каждая точка входа получает своё имя.": "Har bir kirish nuqtasi o'z nomini oladi.",
      "Один дизайн меню, разные QR-коды и ссылки. В аналитике видно, откуда открывали меню: из зала, Instagram, номера гостиницы или зоны ресепшен.": "Bitta menyu dizayni, turli QR-kodlar va havolalar. Analitikada menyu qayerdan ochilgani ko'rinadi: zal, Instagram, mehmonxona xonasi yoki resepshn zonasi.",
      "Столы": "Stollar",
      "Летняя терраса": "Yozgi terasa",
      "Гостиничные номера": "Mehmonxona xonalari",
      "Ресепшен": "Resepshn",
      "Вход": "Kirish",
      "Источники показывают переходы и вовлечение, а не покупки или выручку.": "Manbalar xarid yoki tushumni emas, o'tishlar va jalb etilishni ko'rsatadi.",
      "Источники меню": "Menyu manbalari",
      "7 активных": "7 faol",
      "+ Новый источник": "+ Yangi manba",
      "Основная ссылка для гостей внутри заведения": "Muassasa ichidagi mehmonlar uchun asosiy havola",
      "Ссылка в профиле": "Profildagi havola",
      "Гостиница": "Mehmonxona",
      "Номера и гостевые зоны": "Xonalar va mehmon zonalari",
      "Отдельный QR на столах": "Stollarda alohida QR",
      "Для разных форматов": "Turli formatlar uchun",
      "Продукт один. Сценарий зависит от заведения.": "Mahsulot bitta. Ssenariy muassasaga bog'liq.",
      "Ресторан": "Restoran",
      "Кофейня": "Kofe joyi",
      "Бар": "Bar",
      "Подключение": "Ulash",
      "От вашего меню до запуска — четыре понятных шага.": "Menyudan ishga tushirishgacha to'rtta tushunarli qadam.",
      "Вы передаёте материалы": "Siz materiallarni berasiz",
      "Меню, логотип и фотографии, которые уже есть у заведения.": "Muassasada bor menyu, logotip va fotosuratlar.",
      "Exort собирает страницу": "Exort sahifani yig'adi",
      "Настраиваем структуру, стиль, языки и содержимое меню.": "Tuzilma, uslub, tillar va menyu kontentini sozlaymiz.",
      "Вы получаете доступ": "Siz kirish huquqini olasiz",
      "Передаём QR-коды и рабочую админ-панель владельца.": "QR-kodlar va ishlaydigan admin-panelni beramiz.",
      "Управляете самостоятельно": "O'zingiz boshqarasiz",
      "После запуска меняете позиции, цены и доступность без разработчика.": "Ishga tushgandan so'ng pozitsiya, narx va mavjudlikni dasturchisiz o'zgartirasiz.",
      "Один продукт. Два способа оплаты.": "Bitta mahsulot. Ikki to'lov usuli.",
      "Помесячно": "Oyma-oy",
      "/ месяц": "/ oy",
      "Минимальный срок — 3 месяца": "Minimal muddat - 3 oy",
      "Годовой план": "Yillik reja",
      "в год": "yiliga",
      "включено": "kiritilgan",
      "4 языка и автоматический перевод": "4 til va avtomatik tarjima",
      "Интеграции": "Integratsiyalar",
      "Подключение r_keeper или iiko": "r_keeper yoki iiko ulash",
      "За дополнительную плату": "Qo'shimcha to'lov evaziga",
      "Следующий шаг": "Keyingi qadam",
      "Посмотрите гостевое меню. Возможности админ-панели показаны выше — доступ к ней получает только владелец после подключения.": "Mehmon menyusini ko‘ring. Admin-panel imkoniyatlari yuqorida ko‘rsatilgan — unga kirish faqat ulanishdan keyin egasiga beriladi.",
      "Написать в WhatsApp": "WhatsApp'ga yozish",
      "Цифровое меню · Управление · Аналитика · QR-источники": "Raqamli menyu · Boshqaruv · Analitika · QR-manbalar",
      "Цифровое меню как продукт заведения.": "Raqamli menyu muassasa mahsuloti sifatida.",
      "© Exort. Все данные на странице продукта демонстрационные.": "© Exort. Mahsulot sahifasidagi barcha ma'lumotlar demo uchun o'ylab topilgan.",
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
        : currentLanguage === "uz"
          ? "Exort — raqamli menyu muassasa mahsuloti sifatida"
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
