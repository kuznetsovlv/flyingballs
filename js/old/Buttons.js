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

         // Прячем панель
        if(findButton(e, 'hider')){

            document.getElementById("tohide").style.visibility = "hidden";
            document.getElementById("panel").style.width = 40 + "px";
            document.getElementById("hide").style.display = "none";
            document.getElementById("unhide").style.display = "inline";

            return false;
        };

        // Разворачиваем панель
        if(findButton(e, 'unhider')){

            document.getElementById("tohide").style.visibility = "inherit";
            document.getElementById("panel").style.width = 234 + "px";
            document.getElementById("hide").style.display = "inline";
            document.getElementById("unhide").style.display = "none";

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
            setThumpPosition(0);

            // Удаляем шарики
            for(var i = 0; i < balls.length; i++){

                balls[i].parentNode.removeChild(balls[i]);

            };

            balls = [];
            gravitationState(gravCheckbox);
            //saver();

        };

        // Инвертирование движения
        function inverseVelocity(){

            for(var i = 0; i < balls.length; i++){

                balls[i].velocity.vx *= -1;

                balls[i].velocity.vy *= -1;
            };

          /*  // Если onunload не поддерживается, сохраняем в процессе
            if(!window.onunload){
                saver(balls);       // Сохраняем произведенные изменения
            };   */
        };


    };

};