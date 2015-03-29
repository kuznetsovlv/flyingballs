/**
 *
 * Обработка нажатия кнопок
 *
 * Created with IntelliJ IDEA.
 * User: Baka
 * Date: 09.07.13
 * Time: 21:55
 * To change this template use File | Settings | File Templates.
 */

// Обработка нажатия кнопок
var buttons = new function(){

    // Получение кнопки с заданным атрибутом
    function findButton(event, atribute){
        var elem = event.target;

        while(elem != document && elem.getAttribute(atribute) == null) {
            elem = elem.parentNode;
        }
        return elem == document ? null : elem;

    };


    document.body.onclick = function(e) {



        e = fixEvent(e);  // Обеспечиваем совместимость с IE

        if(e.which != 1) return; // Кнопки срабатывают только на клик левой клавишей

        // Перзапуск страницы
        if(findButton(e, 'restart')) {
            restartPage();
            return false;
        };

        // Изменяем скорость всех шариков на противоположную
        if(findButton(e, 'inverse')) {
            inverseVelocity();
            return false;
        };

        // Устанавливаем гравитационную "постоянную" в 0
        if(findButton(e, 'grav')){
            zeroGrav(); // Отключение гравитации

            // Если onunload не поддерживается, сохраняем в процессе
            if(!window.onunload){
                saver(balls);       // Сохраняем произведенные изменения
            };



            return false;
        };

        // Перезапуск страницы
        function restartPage(){
            // Востанавливаем таблицу
            table.innerHTML = tableSaved;

            // Востанавливаем состояние чекбокса
            checkbox.checked = checked;

            // Отключаем гравитацию
            document.getElementsByClassName('grav')[0].checked = false;
            zeroGrav();

            // Удаляем шарики
            for(var i = 0; i < balls.length; i++){

                balls[i].parentNode.removeChild(balls[i]);

            };

            balls = [];

            // Если onunload не поддерживается, сохраняем в процессе
            if(!window.onunload){
                saver(balls);       // Сохраняем произведенные изменения
            };

        };

        // Инвертирование движения
        function inverseVelocity(){

            for(var i = 0; i < balls.length; i++){

                balls[i].velocity.vx *= -1;

                balls[i].velocity.vy *= -1;
            };

            // Если onunload не поддерживается, сохраняем в процессе
            if(!window.onunload){
                saver(balls);       // Сохраняем произведенные изменения
            };
        };


    };

};