/**
 *
 * Менеджер DRAG'N'DROP
 *
 * Created with IntelliJ IDEA.
 * User: Baka
 * Date: 29.06.13
 * Time: 17:07
 * To change this template use File | Settings | File Templates.
 */

// Элементы управления гравитацией
var sliderElem = document.getElementById('slider');
var thumbElem = sliderElem.children[0];

// Менеджер Drag'n'drop
var dragManager = new function() {

    var movement = false;  // флаг выполнения перетаскивания

    var dragObject = {}; // В этот объект помещается перетаскиваемое изображение
    var date;      // Переменная для хранения даты, используется в расчете скорости
    var now; // Текущее время
    var position ={}; // Объект для хранения положения шарика в момент date;
    var coords ={}; // Текущие координаты шарика
    var mouse = {};

    // При drag'n'drop для совместимости перетаскивается не сам элемент, а его аватар
    function createAvatar(e){
        var avatar = dragObject.elem; // В нашем случае аватар и является элементом
        // Сохраняем изначальные данные объекта
        var old = {
            parent: avatar.parentNode,
            nextSibling: avatar.nextSibling,
            position: avatar.position || '',
            left: avatar.left || '',
            top: avatar.top || '',
            zIndex: avatar.zIndex || '',
            src: avatar.getAttribute('src')
        };

        // Функция, возвращающая объект наместо
        avatar.rollBack = function(){
            old.parent.insertBefore(avatar, old.nextSibling);
            avatar.style.position = old.position;
            avatar.style.left = old.left;
            avatar.style.top = old.top;
            avatar.style.zIndex = old.zIndex;
            avatar.setAttribute('class','balls');
        };

        // Удаляем элемент, в котором хранился перемещаемый объект
        avatar.removeParent = function(){
            old.parent.parentNode.parentNode.removeChild(old.parent.parentNode);
        };

        // Подгрузка в хранилище нового изображение шарика на место перемещенного в область движения
        avatar.regen = function(){
            var img = document.createElement('img');
            img.className = 'balls';
            img.src =  old.src;
            old.parent.appendChild(img);
        };

        // Скорость шарика
        avatar.velocity = {
            vx:0,
            vy:0
        };

        // Запоминаем время начала движения и начальные координаты
        date = + new Date();
        position = getCoords(avatar);

        return avatar;
    };

    // При возникновении события onmousedown эта функция пытается найти элемент, который собираемся перемещать.
    function findElem (event){
        var elem = event.target;
        // В нашем случае мы перемещаем либо шарик, либо ползунок, задающий силу гравитационного взаимодействия
        while(elem != document && elem.getAttribute('class') != "balls" && elem != thumbElem){
            elem = elem.parentNode;
        };

        return elem == document ? null: elem;     //  Если нужного элемента нет, возващаем null, если есть, ссылку на шарик.
    };

    // Проверяем, что пытаемся поместить объект в зону
    function findZone(event){
        // Получаем элемент под перемещаемым объектом, в остальном функция работает аналогично findBall
        var elem = getElementUnderXY(dragObject.avatar, event.clientX, event.clientY);

        while(elem != document && elem.getAttribute('class') != "zone"){
            elem = elem.parentNode;
        };
        return elem == document ? null: elem;
    };

    // Завершение перетаскивания
    function finishDrag(e){
        if(dragObject.avatar == thumbElem)return finishDragThumb(e);

        return finishDragBalls(e);
    };

    function finishDragBalls(e){
        var dropElem = findDroppable(e); // Проверяем, что объект помещен в нужную зону
        // После правок зоной движения является body, поэтому шарик оказывается в зоне, если findDroppable(e) возвращает null
        if(!dropElem){
            // Если успех, в зависимости от состояния чекбокса регенерации теперь ничего не делаем, либо загружаем в нее новый шарик
            if(!checkbox.checked){
                //dragObject.avatar.removeParent();
            }   else{
                dragObject.avatar.regen();
            };

            // На всякий случай последний раз вычисляем скорость
            now = + new Date();
            coords = getCoords(dragObject.avatar); // Определяем координаты перемещаемого объекта

            if(now - date > 100){
                if(Math.abs(position.left - coords.left) > 6){
                    dragObject.avatar.velocity.vx = (coords.left - position.left) / (now - date);
                }
                else {
                    dragObject.avatar.velocity.vx = 0;
                };

                if(Math.abs(position.top - coords.top) > 6){
                    dragObject.avatar.velocity.vy = (coords.top - position.top) / (now - date);
                }
                else {
                    dragObject.avatar.velocity.vy = 0;
                };

                date = now;
                position = coords;

            };

            var k = 50; // Умножаем скорость, чтобы она была близка к скорости, с которой тащили шарик.
            // Коэффициент подобран в ручную

            dragObject.avatar.velocity.vx *=k;
            dragObject.avatar.velocity.vy *=k;

            document.body.appendChild(dragObject.avatar);

             // И передаем перемещенный элемент обработчику движения
            flyingBalls.insertBall(dragObject.avatar);



        }else{

            // Если перетаскивание завершено неправильно, возвращаем объект наместо
            dragObject.avatar.rollBack();
            dragObject.avatar.setAttribute('class','balls');
        };
    };

    function finishDragThumb(e){
        // Определяем положение ползунка


        var x = 0.5 + (getCoords(dragObject.avatar).center.x - getCoords(sliderElem).center.x)/ (sliderElem.clientWidth - dragObject.avatar.clientWidth);


        setG(x);  // По положению ползунка задает гравитационную "постоянную"


    };

    // Функция возвращает элемент, находящийся под перетаскиваемым объектом.
    function getElementUnderXY(elem, clientX, clientY){
        var display = elem.style.display || '';     // Запоминаетм display объекта

        elem.style.display = 'none';          // Прячем объект

        var target = document.elementFromPoint(clientX, clientY);     // Получаем элемент под объектом

        elem.style.display = display;   // Вновь показываем объект

        if(!target || target == document) target = document.body;   // Если пытаемся получить элемент за пределами окна, будет возвращено document.body

        return target;
    };

    // Начало перетаскивания
    function startDrag(e){
        var avatar = dragObject.avatar;
        // Переносим объект в body и помещаем над всеми остальными
        document.body.appendChild(avatar);
        avatar.style.zIndex = 999999;
        avatar.style.position = 'absolute';

    };


    // Обработка нажатия мыши
    function onMouseDone(e){

        e = fixEvent(e);   // Обеспечиваем совместимость с IE

        if(e.which != 1) return false; // Если нажата правая клавиша, ничего не делать

        var elem = findDragAble(e); // Пытаемся получить элемент для перетаскивания

        if(!elem) return false; // На случай, если событие сработало не на dragable элементе (например, всплыло), это вызывало ошибки в остальных браузерах




        dragObject.elem = elem;  // Заносим элемент в перетаскиваемый объект

        // Запоминаем начальные координаты мыши

        dragObject.downX = e.pageX;
        dragObject.downY = e.pageY;

        return false;
    };

    // Обработка движения мыши
    function onMouseMove(e){
        if(!dragObject.elem) return; // Если нет перетаскиваемого элемента, ничего не делаем
        e = fixEvent(e);

        // Способ перемещения зависит от перемещаемого элемента
        if(dragObject.elem != thumbElem) {


            return MovingBalls(e);
        }

        return MovingThumb(e);

    };

    // Перемещение шариков
    function MovingBalls(e){

        // Если перетаскивание не началось, проверяем смещение мыши
        if(!dragObject.avatar){
            var moveX = e.pageX - dragObject.downX;
            var moveY = e.pageY - dragObject.downY;

            mouse.left = e.pageX;
            mouse.top = e.pageY;

            if(Math.abs(moveX) < 3 && Math.abs(moveY) < 3) return;    // Перетаскивать элемент начинаем только после того, как мышь сдвинется на достаточно большое расстояние





        };

        // Если перетаскиваемый аватар не создан, пытаемся его создать
        if(!dragObject.avatar) {
            dragObject.avatar = createAvatar(e);
            dragObject.avatar.setAttribute('class','flyingballs'); // Меняем у шариков значение class, чтобы отключить css анимацию
        }
        if(!dragObject.avatar){
            // Если аватар создать не получилось, очищаем объект и ничего не делаем
            dragObject = {};
            return;
        };

        coords = getCoords(dragObject.avatar); // Определяем координаты перемещаемого объекта

        // Вначале перетаскивания определяем смещение мыши относительно объекта
       if(!movement){
            dragObject.shiftX = e.pageX - coords.left;
            dragObject.shiftY = e.pageY - coords.top;
            movement = true;
        };

        // Инициируем перетаскивание
        startDrag(e);


         // Перемещаем оъект с учетом его смещения относительно мыши
        dragObject.avatar.style.left = e.pageX - dragObject.shiftX + 'px';
        dragObject.avatar.style.top = e.pageY - dragObject.shiftY + 'px';

        // Вычисление скорости
        now = + new Date();


        if(now - date > 100){
            if(Math.abs(position.left - coords.left) > 6){
                dragObject.avatar.velocity.vx = (coords.left - position.left) / (now - date);
            }
            else {
                dragObject.avatar.velocity.vx = 0;
            };

            if(Math.abs(position.top - coords.top) > 6){
                dragObject.avatar.velocity.vy = (coords.top - position.top) / (now - date);
            }
            else {
                dragObject.avatar.velocity.vy = 0;
            };

            date = now;
            position = coords;



        };


    };

    // Перемещение ползунка
    function MovingThumb(e){

        // Ползунок перемещается только, если гравитация включена
        if(!document.getElementsByClassName('grav')[0].checked) return;

        // Если перетаскивание не началось, проверяем смещение мыши
        // Ползунок может двигаться только по горизонтали
        if(!dragObject.avatar){
            var moveX = e.pageX - dragObject.downX;

            mouse.left = e.pageX;

            if(Math.abs(moveX) < 3) return;    // Перетаскивать элемент начинаем только после того, как мышь сдвинется на достаточно большое расстояние
        };

        // Если перетаскиваемый аватар не создан, пытаемся его создать
        if(!dragObject.avatar) dragObject.avatar = createAvatar(e);
        if(!dragObject.avatar){
            // Если аватар создать не получилось, очищаем объект и ничего не делаем
            dragObject = {};
            return;
        };

        var coords = getCoords(dragObject.avatar); // Определяем координаты перемещаемого объекта
        sliderElem.coords = getCoords(sliderElem); // Определяем координаты слайдера


        // Вначале перетаскивания определяем смещение мыши относительно объекта
        if(!movement){
            dragObject.shiftX = e.pageX - coords.left;

            movement = true;
        };


        // Перемещаем оъект с учетом его смещения относительно мыши
        dragObject.avatar.style.left = (e.pageX - sliderElem.coords.left) - dragObject.shiftX + 'px';

        // Проверяем, что ползунок не выйдет за приеделы слайдера
        coords = getCoords(dragObject.avatar);
        if(coords.left < sliderElem.coords.left) dragObject.avatar.style.left = 0 + 'px';
        if(coords.right > sliderElem.coords.right) dragObject.avatar.style.left = sliderElem.clientWidth - dragObject.avatar.clientWidth + 'px';


    };

    // Обработчик отпускания мыши
    function onMoseUp(e){

        // Если есть перетаскиваемый объект, обеспечиваем совместимость с IE и запускаем функцию окончания перетаскивания
        if(dragObject.avatar){
            e = fixEvent(e);
            finishDrag(e);
        }

        // Очищаем перетаскиваемый объект и выставляем флаг  выполнения перетаскивания в false
        dragObject = {};
        movement = false;
    };

    // Определяем функции в соответсвии с нашими целями
    // Так проще в будущем будет переделать драгменеджер
    document.onmousedown = onMouseDone;
    document.onmousemove = onMouseMove;
    document.onmouseup = onMoseUp;

    var findDragAble = findElem;
    var findDroppable = findZone;
};


