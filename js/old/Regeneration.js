/**
 *
 * УПРАВЛЕНИЕ РЕГЕНЕРАЦИЕЙ ТАБЛИЦЫ
 *
 * Created with IntelliJ IDEA.
 * User: Baka
 * Date: 09.07.13
 * Time: 22:18
 * To change this template use File | Settings | File Templates.
 */

// Запоминаем состояние чекбокса, управляющего регенерацией
var checkbox = document.getElementsByClassName('regen')[0];
var checked = checkbox.checked;

// Управление регенерацией
var regeneration = new function(){

    if("onpropertychange" in checkbox) {
        // если поддерживается (IE)
        checkbox.onpropertychange = function() {
            if (event.propertyName == "checked") { // имя свойства
                regenerateTable();
                // Если onunload не поддерживается, сохраняем в процессе
                if(!window.onunload){
                    saver(balls);
                };

            };

        };
    } else {
        // остальные браузеры
        checkbox.onchange = function() {
            regenerateTable();
            // Если onunload не поддерживается, сохраняем в процессе
            if(!window.onunload){
                saver(balls);
            };
        };


    };



};