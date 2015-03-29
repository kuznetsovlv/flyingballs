/**
 *
 * ФУНКЦИИ ОБЩЕГО НАЗНАЧЕНИЯ
 *
 * Created with IntelliJ IDEA.
 * User: Baka
 * Date: 30.06.13
 * Time: 18:35
 * To change this template use File | Settings | File Templates.
 */



// Сохраняется содержимое хранилища шариков
var table = document.body.getElementsByClassName("balls-container")[0];
var tableSaved = table.innerHTML;

// Получение координат объекта относительно документа
function getCoords(elem) {
    var box = elem.getBoundingClientRect();
    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    var right =  box.right + scrollTop - clientTop;
    var bottom = box.bottom + scrollLeft - clientLeft;

    var xCenter = (right + left) / 2;
    var yCenter = (bottom + top) / 2;


    return { top: top, left: left, right: right, bottom: bottom, xCenter: xCenter, yCenter: yCenter};
};

// Функция обеспечения совместимости с IE.
function fixEvent(e, _this){
    e = e || window.event;

    if (!e.currentTarget) e.currentTarget = _this;
    if (!e.target) e.target = e.srcElement;

    if (!e.relatedTarget) {
        if (e.type == 'mouseover') e.relatedTarget = e.fromElement;
        if (e.type == 'mouseout') e.relatedTarget = e.toElement;
    };

    if (e.pageX == null && e.clientX != null ) {
        var html = document.documentElement;
        var body = document.body;

        e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
        e.pageX -= html.clientLeft || 0;

        e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
        e.pageY -= html.clientTop || 0;
    };

    if (!e.which && e.button) {
        e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : (e.button & 4 ? 2 : 0) );
    };

    return e;

};

//Востановление таблицу
function regenerateTable(){

    if(!checkbox.checked) return;

    table.innerHTML = tableSaved;
};

// Сохранение состояния страницы
function saver(balls){

    if(!window.localStorage && !localStorage) return saveCookies(); // Такая ситуация бывает, например при запуске страничке в IE с локального диска (поэтому в IE оно и не работало)
    // Конечно, в этом случае не будет сохраняться, но мне не кажется это проблемой, поскольку браузеры используются для работы с web ресурсами

    var save = {}; // Сохраняемый объект

    // Запоминаем содержимое таблицы
    var container = document.body.getElementsByClassName("balls-container")[0];
    save.table = '' + container.innerHTML;

    // Запоминаем состояние чекбокса
    save.checkbox = document.body.getElementsByClassName("regen")[0].checked;

    // Запоминаем состояния шариков
    save.balls = [];

    for(var i = 0; i < balls.length; i++){
        var obj = {
            coords: balls[i].coords,
            velocity: balls[i].velocity,
            zIndex: balls[i].style.zIndex,
            src: balls[i].src
        };

        save.balls.push(obj);
    };


    // Запоминаем параметры гравитации
    save.gravitationOn = document.getElementsByClassName('grav')[0].checked;
    save.thumbPos = getCoords(thumbElem).left - getCoords(sliderElem).left;
    // Поскольку гравитационная постоянная задается положением ползунка, достаточно запомнить только его

    // Преобразуем в строку и сохраняем данные
   localStorage.data = JSON.stringify(save);

};

function upload(){

    if(!window.localStorage && !localStorage) return uploadCookies(); // Такая ситуация бывает, например при запуске страничке в IE с локального диска (поэтому в IE оно и не работало)
    // Конечно, в этом случае не будет сохраняться, но мне не кажется это проблемой, поскольку браузеры используются для работы с web ресурсами


    // Поучаем сохраненные данные
    var uploaded = JSON.parse(localStorage.data);

    // Если данные не ивлечены, ничего не делаем
    if(!uploaded) return;

    // Востанавливаем состояние таблицы
    var table = document.body.getElementsByClassName("balls-container")[0];
    table.innerHTML = uploaded.table;

    // Востанавливаем состояние чекбокса регенерации таблицы
    var checkbox = document.getElementsByClassName('regen')[0];
    checkbox.checked = uploaded.checkbox;

    // Востанавливаем гравитацию
    document.getElementsByClassName('grav')[0].checked = uploaded.gravitationOn;
    thumbElem.style.left = uploaded.thumbPos + 'px';
    setG((getCoords(thumbElem).xCenter - sliderElem.coords.left)/ (sliderElem.coords.right - sliderElem.coords.left));

    //Подгружаем шарики
    for(var i = 0; i < uploaded.balls.length; i++){

        var ball = document.createElement('img');

        ball.setAttribute('class','flyingballs');


        ball.src = uploaded.balls[i].src;

        ball.velocity = uploaded.balls[i].velocity;
        ball.style.zIndex = uploaded.balls[i].zIndex;
        ball.style.position = 'absolute';

        ball.coords = uploaded.balls[i].coords;


        document.body.appendChild(ball);

        ball.style.left = ball.coords.left + 'px';
        ball.style.top = ball.coords.top + 'px';



        flyingBalls(ball);

    };


};

// Отключение гравитации
function zeroGrav(){
    // Устанавливаем бегунок в середину слайдера
    sliderElem.coords = getCoords(sliderElem);
    thumbElem.coords = getCoords(thumbElem);
    thumbElem.style.left = Math.round(sliderElem.coords.xCenter - sliderElem.coords.left - (thumbElem.coords.right - thumbElem.coords.left) / 2) + 'px';

    // Устанавливаем g
    setG(0.5);
};

function saveCookies(){
    // На всякий случай.
    if (!navigator.cookieEnabled) {

        return;

    };

    var Time = 3600; // Время хранения куков в секундах

     // Запоминаем сосотояние чекбокса регенерации
    setCookie('regen', document.body.getElementsByClassName("regen")[0].checked,{expires: Time});

    // Запоминаем состояние контейнера
    setCookie('table', document.body.getElementsByClassName("balls-container")[0].innerHTML,{expires: Time});

    // Запоминаем параметры гравитации
    setCookie('gravitationOn', document.getElementsByClassName('grav')[0].checked, {expires: Time});
    setCookie('thumbPos', getCoords(thumbElem).left - getCoords(sliderElem).left, {expires: Time});

    // Сохраняем шарики
    for(var i = 0; i < balls.length; i++){
        setCookie('ball' + i + 'x', balls[i].coords.left, {expires: Time});
        setCookie('ball' + i + 'y', balls[i].coords.top, {expires: Time});
        setCookie('ball' + i + 'vx', balls[i].velocity.vx, {expires: Time});
        setCookie('ball' + i + 'vy', balls[i].velocity.vy, {expires: Time});
        setCookie('ball' + i + 'src', balls[i].src, {expires: Time});
        setCookie('ball' + i + 'z', balls[i].zIndex, {expires: Time});

    };

    setCookie('balls', balls.length, {expires: Time}); // Запоминаем число шариков

    return;
};

function uploadCookies() {
    // Это функция вызывается в начале работы страници, если при загрузке выясняется, что браузер не поддерживает localStorage,
    // поэтому alert внутри условия сработает только при неработающих localStorage и cookie.
    // Проверку помещаем здесь, а не в сохранении спецально, чтобы, еслипользователь не хочет включать сохранение, страница могла нормально работать.
    if (!navigator.cookieEnabled) {

        alert('Для комфортной работы с этим сайтом включите подержку localStorage или cookie.');
        return;

    };


    // Востанавливаем гравитацию
    document.getElementsByClassName('grav')[0].checked =getCookie('gravitationOn') == 'true' ? true: false;      // getCookie возвращает строку, которая всегда преобразуется к true (если не пуста), поэтому приходится присвоение делать таким образом
    sliderElem.coords = getCoords(sliderElem);
    thumbElem.coords = getCoords(thumbElem);

    var thumbPos = +getCookie('thumbPos') || Math.round(sliderElem.coords.xCenter - sliderElem.coords.left - (thumbElem.coords.right - thumbElem.coords.left) / 2);
    thumbElem.style.left = thumbPos + 'px';
    setG((getCoords(thumbElem).xCenter - sliderElem.coords.left)/ (sliderElem.coords.right - sliderElem.coords.left));

    //Подгружаем шарики
    for(var i = 0; i < +getCookie('balls'); i++){

        var ball = document.createElement('img');

        ball.setAttribute('class','flyingballs');


        ball.src = getCookie('ball' + i + 'src');

        ball.velocity = {
            vx: +getCookie('ball' + i + 'vx') || 0,
            vy: +getCookie('ball' + i + 'vy') || 0

        };

        ball.coords = {
            left: +getCookie('ball' + i + 'x') || getCoords(document.body.getElementsByClassName('zone')[0]).left,
            top: +getCookie('ball' + i + 'y') || getCoords(document.body.getElementsByClassName('zone')[0]).top

        };

        ball.style.zIndex = +getCookie('ball' + i + 'z') || 0;
        ball.style.position = 'absolute';


        document.body.appendChild(ball);

        ball.style.left = ball.coords.left + 'px';
        ball.style.top = ball.coords.top + 'px';



        flyingBalls(ball);   // Вызывающий двиение и сохранение setInterval согласно спецификации сработает только после того,
        // как текущий код завершит работу, поэтому затирания куков не боимся.


    };

    // Востанавливаем состояние контейнера с шариками, чтобы не потерять контейнер, если кук удалился, проверяем его наличие
    if(getCookie('table')) document.body.getElementsByClassName("balls-container")[0].innerHTML = '' + getCookie('table');

    // Востанавливаем состояние чекбокса регенерации, востанавливаем в последнюю очередь, поскольку в случае, если браузер не поддерживает сразу onuload и localStorage, это востановление
    // затрет все cookie, вызвав обработчик изменения состояния данного чекбокса, содержащий вызов сохранения состояния
    var checkbox = document.getElementsByClassName('regen')[0];
    checkbox.checked = getCookie('regen') == 'true'? true: false; // getCookie возвращает строку, которая всегда преобразуется к true (если не пуста), поэтому приходится присвоение делать таким образом
};
