/**
 *
 * ГРАВИТАЦИОННОЕ ВЗАИМОДЕЙСТВИЕ
 *
 * Created with IntelliJ IDEA.
 * User: Baka
 * Date: 08.07.13
 * Time: 14:34
 * To change this template use File | Settings | File Templates.
 */

// Максимальное и минимальное значения гравитационной "постоянной"
var GMAX = 30;
var GMIN = - GMAX;

var g = 0; // Гравитационная "постоянная"

// Определяем гравитационную "постоянную" в зависимости от положения ползунка на слайдере
function setG(a){
    if(a > 1 || a < 0) return NaN;
    g = a * GMAX + (1 - a) * GMIN;
    document.getElementById("textfield").value = Math.round(1000 * g) / 10;


};


// Определяем воздействие гравитационного поля
function gravitation(position, ball) {
    var dx, dy, rr, r, a, ax, ay, h;


    dx = ball.position().center.x - position.x;
    dy = ball.position().center.y - position.y;

    rr = Math.pow(dx,2) + Math.pow(dy,2);  // Квадрат расстояния между центрами

    r = Math.sqrt(rr); // Расстояние между центрами

    h = 1 - Math.exp(-r / 10000);   // Шаг аппроксимации силы тяжести
    /* Если шаг слишком маленький, расчет идет слишком медленно, при слишком большом шаге возникают большие неточности,
    * которые наиболее всего заметны при взаимодействии близлежащих шариков. При этом, влияние ближайших объектов более значимо
    * по сравнению с удаленными, поэтому расчет шага подбирался так, чтобы для ближайших шариков о был меньше, а для удаленных - больше
    * */



    a = r > position.radius + ball.radius ? g * ball.mass / rr : 0; // Итоговое ускорение
    // Если шарики сблизились так, что растояние между их центрами меньше суммы радиусов, притяжение между ними не работает, чтобы они могли разойтись

     // Проекции ускорения
    ax = a * dx / r;
    ay = a * dy / r;


    return {ax: ax, ay: ay, h: h};
};

/* Расчет гравитационного взаимодействия проводился по методу Рунге-Кута 4 порядка
*(http://ru.wikipedia.org/wiki/%D0%9C%D0%B5%D1%82%D0%BE%D0%B4_%D0%A0%D1%83%D0%BD%D0%B3%D0%B5_%E2%80%94_%D0%9A%D1%83%D1%82%D1%82%D0%B0)
* */
function gravRungeKutta4(ball){

    var a, h, dv = {x:0, y:0};

    for(var i = 0; i < balls.length; i++){
        if(ball === balls[i]) continue;

        a = gravitation({x: ball.position().center.x, y: ball.position().center.y, radius: ball.radius}, balls[i]);

        h = a.h;  // Шаг расчета

        dv.x += h * a.ax;
        dv.y += h * a.ay;

        // В нашем случае k2 и k3 одинаковые
        a = gravitation({x: ball.position().center.x + h / 2, y: ball.position().center.y + h /2, radius: ball.radius}, balls[i]);

        dv.x += 4 * h * a.ax;
        dv.y += 4 * h * a.ay;

        a = gravitation({x: ball.position().center.x + h, y: ball.position().center.y + h, radius: ball.radius}, balls[i]);

        dv.x += h * a.ax;
        dv.y += h * a.ay;
    };

    ball.velocity.vx += (dv.x / 6) || 0;
    ball.velocity.vy += (dv.y / 6) || 0;
};
