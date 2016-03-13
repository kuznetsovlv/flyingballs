/**
 * // Обработка изменений состояний чекбоксов
 * Created with IntelliJ IDEA.
 * User: Baka
 * Date: 05.08.13
 * Time: 1:24
 * To change this template use File | Settings | File Templates.
 */


var checkbox = document.getElementsByClassName('regen')[0];   // Востанавливающий шарики чекбокс
var gravCheckbox = document.getElementsByClassName('grav')[0];   // Включение - отключение гравитации
var checked = checkbox.checked;



// Управление регенерацией
var regeneration = new function(){

    if("onpropertychange" in checkbox) {
        // если поддерживается (IE)
        checkbox.onpropertychange = function() {
            if (event.propertyName == "checked") { // Востановление таблицы с шариками
                regenerateTable();
               //saver();

            };

        };

        gravCheckbox.onpropertychange = function() {
            gravitationState(gravCheckbox);   // Выставляе состояние элементов управления гравитацией

        };

    } else {
        // остальные браузеры
        checkbox.onchange = function() {    // Востановление таблицы с шариками

            regenerateTable();
           // saver();
        };

        gravCheckbox.onchange = function() {
            gravitationState(gravCheckbox);      // Выставляе состояние элементов управления гравитацией
    };

    };
};





