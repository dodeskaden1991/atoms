/* =========================================================
   ATMOS RUNES — ELDER FUTHARK (24 руни)
   ---------------------------------------------------------
   Руни, маркирани с noReversed: true, не се обръщат.
   Всички карти са с override URL (Imgur, CORS-friendly).
========================================================= */

window.atmosRunes = [
  { id: "fehu", number: 1, name: "Fehu", symbol: "ᚠ",
    keywords: { upright: ["богатство", "изобилие", "късмет"], reversed: ["загуба", "алчност", "финансови проблеми"] },
    upright: "Богатство, изобилие и късмет. Материалното и духовното текат към теб.",
    reversed: "Загуба, алчност или финансови проблеми. Парите не са всичко — преоцени.",
    filename: "fehu.png", override: "https://i.imgur.com/7jMCC5O.jpeg", noReversed: false },

  { id: "uruz", number: 2, name: "Uruz", symbol: "ᚢ",
    keywords: { upright: ["сила", "здраве", "жизненост"], reversed: ["слабост", "болест", "застой"] },
    upright: "Първична сила, здраве и жизненост. Дивата енергия работи в твоя полза.",
    reversed: "Слабост, болест или застой. Тялото и духът искат внимание.",
    filename: "uruz.png", override: "https://i.imgur.com/wQ5Xh8e.jpeg", noReversed: false },

  { id: "thurisaz", number: 3, name: "Thurisaz", symbol: "ᚦ",
    keywords: { upright: ["защита", "предизвикателство", "сила"], reversed: ["опасност", "конфликт", "безразсъдство"] },
    upright: "Защита и предизвикателство. Силата идва чрез преодоляване на пречка.",
    reversed: "Опасност, конфликт или безразсъдство. Внимавай с решенията.",
    filename: "thurisaz.png", override: "https://i.imgur.com/N6nvfSU.jpeg", noReversed: false },

  { id: "ansuz", number: 4, name: "Ansuz", symbol: "ᚨ",
    keywords: { upright: ["мъдрост", "слово", "комуникация"], reversed: ["лъжа", "объркване", "манипулация"] },
    upright: "Мъдрост, слово и божествено вдъхновение. Слушай посланията около теб.",
    reversed: "Лъжа, объркване или манипулация. Не вярвай на всяка дума.",
    filename: "ansuz.png", override: "https://i.imgur.com/rfE3ZQ3.jpeg", noReversed: false },

  { id: "raidho", number: 5, name: "Raidho", symbol: "ᚱ",
    keywords: { upright: ["пътуване", "движение", "прогрес"], reversed: ["застой", "забавяне", "объркване"] },
    upright: "Пътуване, движение и напредък. Пътят се открива пред теб.",
    reversed: "Застой, забавяне или объркване. Преосмисли посоката.",
    filename: "raidho.png", override: "https://i.imgur.com/0rwfF3J.jpeg", noReversed: false },

  { id: "kenaz", number: 6, name: "Kenaz", symbol: "ᚲ",
    keywords: { upright: ["знание", "творчество", "вдъхновение"], reversed: ["невежество", "блокиране", "загуба"] },
    upright: "Факлата на знанието. Творчество, вдъхновение и разкриване на истината.",
    reversed: "Невежество, блокиране или загуба на посока. Светлината угасва — запали я отново.",
    filename: "kenaz.png", override: "https://i.imgur.com/2SFEb14.jpeg", noReversed: false },

  { id: "gebo", number: 7, name: "Gebo", symbol: "ᚷ",
    keywords: { upright: ["дар", "партньорство", "обмен"], reversed: [] },
    upright: "Дар, партньорство и щедрост. Даването и получаването са в баланс.",
    reversed: "",
    filename: "gebo.png", override: "https://i.imgur.com/PloZM4s.jpeg", noReversed: true },

  { id: "wunjo", number: 8, name: "Wunjo", symbol: "ᚹ",
    keywords: { upright: ["радост", "хармония", "успех"], reversed: ["тъга", "дисхармония", "провал"] },
    upright: "Радост, хармония и успех. Всичко се подрежда в твоя полза.",
    reversed: "Тъга, дисхармония или провал. Радостта е временно скрита.",
    filename: "wunjo.png", override: "https://i.imgur.com/nHco6yr.jpeg", noReversed: false },

  { id: "hagalaz", number: 9, name: "Hagalaz", symbol: "ᚺ",
    keywords: { upright: ["трансформация", "пречистване", "промяна"], reversed: [] },
    upright: "Градушката разчиства старото. Трансформация чрез криза — неизбежна, но пречистваща.",
    reversed: "",
    filename: "hagalaz.png", override: "https://i.imgur.com/gVfsVPv.jpeg", noReversed: true },

  { id: "nauthiz", number: 10, name: "Nauthiz", symbol: "ᚾ",
    keywords: { upright: ["нужда", "ограничение", "търпение"], reversed: ["освобождение", "изход", "облекчение"] },
    upright: "Нужда, ограничение и търпение. Липсата учи на устойчивост.",
    reversed: "Освобождение от ограничение. Излизаш от кризата по-силен.",
    filename: "nauthiz.png", override: "https://i.imgur.com/c3Rbyt9.jpeg", noReversed: false },

  { id: "isa", number: 11, name: "Isa", symbol: "ᛁ",
    keywords: { upright: ["застой", "пауза", "изчакване"], reversed: [] },
    upright: "Ледът спира всичко. Пауза, изчакване и вътрешно съзерцание. Не бързай.",
    reversed: "",
    filename: "isa.png", override: "https://i.imgur.com/gE0Pamd.jpeg", noReversed: true },

  { id: "jera", number: 12, name: "Jera", symbol: "ᛃ",
    keywords: { upright: ["реколта", "възнаграждение", "цикъл"], reversed: [] },
    upright: "Реколтата идва. Трудът се възнаграждава в точния момент. Циклите се затварят.",
    reversed: "",
    filename: "jera.png", override: "https://i.imgur.com/op8xMwL.jpeg", noReversed: true },

  { id: "eihwaz", number: 13, name: "Eihwaz", symbol: "ᛇ",
    keywords: { upright: ["трансформация", "устойчивост", "защита"], reversed: [] },
    upright: "Тисът, който свързва световете. Трансформация, устойчивост и скрита защита.",
    reversed: "",
    filename: "eihwaz.png", override: "https://i.imgur.com/UTUFkpY.jpeg", noReversed: true },

  { id: "perthro", number: 14, name: "Perthro", symbol: "ᛈ",
    keywords: { upright: ["тайна", "съдба", "мистерия"], reversed: ["разкритие", "изненада", "объркване"] },
    upright: "Тайната на съдбата. Скрито знание, мистерия и неочаквани обрати.",
    reversed: "Разкритие или объркване. Тайната излиза наяве — понякога болезнено.",
    filename: "perthro.png", override: "https://i.imgur.com/gxL57La.jpeg", noReversed: false },

  { id: "algiz", number: 15, name: "Algiz", symbol: "ᛉ",
    keywords: { upright: ["защита", "интуиция", "връзка с боговете"], reversed: ["скрита опасност", "загуба на защита", "страх"] },
    upright: "Защита, интуиция и връзка с висшите сили. Ръцете на боговете те пазят.",
    reversed: "Скрита опасност или загуба на защита. Бъди бдителен.",
    filename: "algiz.png", override: "https://i.imgur.com/CjL3olR.jpeg", noReversed: false },

  { id: "sowilo", number: 16, name: "Sowilo", symbol: "ᛋ",
    keywords: { upright: ["победа", "светлина", "успех"], reversed: [] },
    upright: "Слънцето грее върху теб. Победа, светлина и успех във всяко начинание.",
    reversed: "",
    filename: "sowilo.png", override: "https://i.imgur.com/k8zBb8k.jpeg", noReversed: true },

  { id: "tiwaz", number: 17, name: "Tiwaz", symbol: "ᛏ",
    keywords: { upright: ["справедливост", "чест", "победа"], reversed: ["несправедливост", "загуба", "безчестие"] },
    upright: "Справедливост, чест и победа чрез саможертва. Истината е на твоя страна.",
    reversed: "Несправедливост или загуба. Не ти е дадено това, което заслужаваш.",
    filename: "tiwaz.png", override: "https://i.imgur.com/5yoCBHu.jpeg", noReversed: false },

  { id: "berkano", number: 18, name: "Berkano", symbol: "ᛒ",
    keywords: { upright: ["раждане", "растеж", "грижа"], reversed: ["застой", "безплодие", "пренебрегване"] },
    upright: "Брезата цъфти. Раждане, растеж и грижа за новото — бъди търпелив.",
    reversed: "Застой, безплодие или пренебрегване. Нещо ново чака да бъде отгледано.",
    filename: "berkano.png", override: "https://i.imgur.com/bUMh7dc.jpeg", noReversed: false },

  { id: "ehwaz", number: 19, name: "Ehwaz", symbol: "ᛖ",
    keywords: { upright: ["движение", "доверие", "напредък"], reversed: ["застой", "недоверие", "блокиране"] },
    upright: "Конят те носи напред. Движение, доверие и партньорство в посока успех.",
    reversed: "Застой, недоверие или блокиране. Нещо задържа движението ти.",
    filename: "ehwaz.png", override: "https://i.imgur.com/8wNLzm0.jpeg", noReversed: false },

  { id: "mannaz", number: 20, name: "Mannaz", symbol: "ᛗ",
    keywords: { upright: ["общност", "себепознание", "подкрепа"], reversed: ["изолация", "егоизъм", "враждебност"] },
    upright: "Човекът в общността. Себепознание, подкрепа и връзки с другите.",
    reversed: "Изолация, егоизъм или враждебност. Отдръпни се или погледни вътре в себе си.",
    filename: "mannaz.png", override: "https://i.imgur.com/aOmuxZm.jpeg", noReversed: false },

  { id: "laguz", number: 21, name: "Laguz", symbol: "ᛚ",
    keywords: { upright: ["интуиция", "поток", "емоции"], reversed: ["объркване", "страх", "потискане"] },
    upright: "Водата тече. Интуиция, поток и дълбоки емоции. Довери се на чувствата си.",
    reversed: "Объркване, страх или потискане. Не се бори с потока — остави се да те води.",
    filename: "laguz.png", override: "https://i.imgur.com/2sKCgUU.png", noReversed: false },

  { id: "ingwaz", number: 22, name: "Ingwaz", symbol: "ᛜ",
    keywords: { upright: ["потенциал", "растеж", "плодородие"], reversed: [] },
    upright: "Семето е посято. Потенциал, вътрешен растеж и плодородие. Чакай да покълне.",
    reversed: "",
    filename: "ingwaz.png", override: "https://i.imgur.com/ic7vxuq.jpeg", noReversed: true },

  { id: "dagaz", number: 23, name: "Dagaz", symbol: "ᛞ",
    keywords: { upright: ["пробуждане", "прозрение", "трансформация"], reversed: [] },
    upright: "Денят настъпва. Пробуждане, прозрение и радикална трансформация към по-добро.",
    reversed: "",
    filename: "dagaz.png", override: "https://i.imgur.com/7bOk8FQ.jpeg", noReversed: true },

  { id: "othala", number: 24, name: "Othala", symbol: "ᛟ",
    keywords: { upright: ["наследство", "дом", "сигурност"], reversed: ["загуба", "бездомност", "откъсване"] },
    upright: "Наследство, дом и сигурност. Родът и корените те подкрепят.",
    reversed: "Загуба, бездомност или откъсване. Връзката с корените е нарушена.",
    filename: "othala.png", override: "https://i.imgur.com/q3EPurP.jpeg", noReversed: false }
];

window.getRuneImageUrl = function(rune) {
  if (rune.override && rune.override.trim().length > 0) return rune.override.trim();
  return null;
};