/**
 *
 * ГРАВИТАЦИОННОЕ ВЗАИМОДЕЙСТВИЕ
 *
 * Created with IntelliJ IDEA.
 * U                   ser: Baka
 * Date: 08.07.13
 * Time: 14:34
 * To change this template use File | Settings | File Templates.
 */

// Максимальное и минимальное значения гравитационной "постоянной"
var GMAX = 0.01;
var GMIN = - GMAX;

var g = 0; // Гравитационная "постоянная"

// Определяем гравитационную "постоянную" в зависимости от положения ползунка на слайдере
function setG(a){
    if(a > 1 || a < 0) return NaN;
    g = a * GMAX + (1 - a) * GMIN;
};


// Определяем воздействие гравитационного поля
function gravitation(ball, balls) {

    ball.coords = getCoords(ball);

    // Функция возвращает изменение скорости ball от гравитационного воздействия obj
    function acceleration(obj){

        obj.coords = getCoords(obj);

        //Смещение
        var dx = obj.coords.xCenter - ball.coords.xCenter;
        var dy = obj.coords.yCenter - ball.coords.yCenter;

        var rr = Math.pow(dx,2) + Math.pow(dy,2);  // Квадрат расстояния между центрами

        var r = Math.sqrt(rr); // Расстояние между центрами

        if(r <= ball.radius + obj.radius) return {ax: 0, ay: 0};   // obj == ball, или получилось из-за дискретности смещения

        var a = g * obj.mass / rr; // Итоговое ускорение

        // Проекции ускорения по осям
        var ax = a * dx / r;
        var ay = a * dy / r;

        return {ax: ax, ay: ay};
    };

    // Проверяем, как в текущем гравитационном поле меняется скорость ball
    for(var i = 0; i < balls.length; i++){
        var a = acceleration(balls[i]);

        ball.velocity.vx += a.ax;
        ball.velocity.vy += a.ay;
    };

};

