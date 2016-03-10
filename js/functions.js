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


    var center = {
          x: (right + left) / 2,
          y: (bottom + top) / 2
    };


    return { top: top, left: left, right: right, bottom: bottom, center: center};
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
function saver(){



    var save = {}; // Сохраняемый объект

    // Запоминаем содержимое таблицы
    save.table = '' + document.body.getElementsByClassName("balls-container")[0].innerHTML;

    // Запоминаем состояние чекбокса
    save.checkbox = document.body.getElementsByClassName("regen")[0].checked;

    // Запоминаем состояния шариков
    save.balls = [];

    for(var i = 0; i < balls.length; i++){

        var lnk = balls[i].src.split("/");  //Исправление старого бага, связнного с проблемой загрузки изображений шариков при перемещении страницы после предыдущего запуска

        var obj = {
            position: {
                left: balls[i].position().left,
                top: balls[i].position().top
            },
            velocity: balls[i].velocity,
            zIndex: balls[i].style.zIndex,
            src: lnk[lnk.length - 1] //Теперь сохраняем только имя картинки
        };

        save.balls.push(obj);
    };


    // Запоминаем параметры гравитации
    save.g = g;
    // Запоминаем состояние чекбокса гравитации
    save.grav = document.body.getElementsByClassName("grav")[0].checked;

    // Состояние боковой панели
    save.tohideVisiblity = document.getElementById("tohide").style.visibility;
    save.panelWidth = document.getElementById("panel").style.width;
    save.hideDisplay = document.getElementById("hide").style.display;
    save.unhideDisplay = document.getElementById("unhide").style.display;

    // Преобразуем в строку и сохраняем данные
    if(!window.localStorage && !localStorage){  // Такая ситуация бывает, например при запуске страничке в IE с локального диска (поэтому в IE оно и не работало)
        setCookie('data', JSON.stringify(save));
    }else{
        localStorage.data = JSON.stringify(save);
    };

    return false;

};

function upload(){

    var uploaded;

    // Поучаем сохраненные данные
    if(!window.localStorage && !localStorage){  // Такая ситуация бывает, например при запуске страничке в IE с локального диска (поэтому в IE оно и не работало)

        if (!navigator.cookieEnabled) {

            alert('Для комфортной работы с этим сайтом включите подержку localStorage или cookie.');
            return;

        };

        uploaded = JSON.parse(getCookie('data'));
    } else{
        uploaded = JSON.parse(localStorage.data);
    };


    // Если данные не извлечены, ничего не делаем
    if(!uploaded) return;

    // Востанавливаем состояние таблицы
    var table = document.body.getElementsByClassName("balls-container")[0];
    table.innerHTML = uploaded.table || table.innerHTML;

    // Востанавливаем состояние чекбокса регенерации таблицы
    var checkbox = document.getElementsByClassName('regen')[0];
    checkbox.checked = uploaded.checkbox;

    // Востанавливаем гравитацию
    setThumpPosition(0.5 + (((+uploaded.g) || 0)) / (2 * GMAX));

    document.getElementsByClassName('grav')[0].checked = uploaded.grav;
    gravitationState(document.getElementsByClassName('grav')[0]);

    // Состояние боковой панели
    document.getElementById("tohide").style.visibility = uploaded.tohideVisiblity || "inherit";
    document.getElementById("panel").style.width = uploaded.panelWidth || "234px";
    document.getElementById("hide").style.display = uploaded.hideDisplay || "inline";
    document.getElementById("unhide").style.display = uploaded.unhideDisplay || "none";

    //Подгружаем шарики
    for(var i = 0; i < uploaded.balls.length; i++){

        var ball = document.createElement('img');

        ball.setAttribute('class','flyingballs');


        ball.src = 'img/' + uploaded.balls[i].src;  //Исправление старого бага, связнного с проблемой загрузки изображений шариков при перемещении страницы после предыдущего запуска

        ball.velocity = uploaded.balls[i].velocity || {vx:0, vy:0};
        ball.style.zIndex = uploaded.balls[i].zIndex || 99999;
        ball.style.position = 'absolute';

        ball.velocity.vx = ball.velocity.vx || 0;
        ball.velocity.vy = ball.velocity.vy || 0;

        document.body.appendChild(ball);

        ball.style.left = ((uploaded.balls[i].position.left) || 0) + 'px';
        ball.style.top = ((uploaded.balls[i].position.top) || 0) + 'px';

        ball.onload = function(){
            flyingBalls.insertBall(this);
        };

    };


};




// Помещаем ползунок в соответсвующее заданному g положение
function setThumpPosition(x){
     // Если x не число, g = 0
    if(!x || x != x) x = 0.5;

    // Если х вышел за допустимые границы, приравниваем его значение значению на соответсвующей границе
    if(x > 1) x = 1;
    if(x < 0) x = 0;

    // Помещаем ползунок в соответсвующее положение
    var thumb = document.body.getElementsByClassName("thumb")[0];
    thumb.style.left =  x * (sliderElem.clientWidth - thumb.clientWidth) + "px";

    setG(x); // Устанавливаем соответсвующую гравитацию

};

// Взависимости от состояния чекбокса гравитации показываем или прячем элементы управления
function gravitationState(gravCheckbox){
    if (gravCheckbox.checked) {
        document.getElementById("slider").style.visibility = "inherit";
        document.getElementById("textfield").value = Math.round(1000 * g) / 10;
        document.getElementById("textfield").style.display = "inline-block";
        document.getElementById("imitator").style.display = "none";
    }
    else{
        document.getElementById("slider").style.visibility = "hidden";
        document.getElementById("textfield").style.display = "none";
        document.getElementById("imitator").style.display = "inline-block";
    };
};