/**
 *
 * ОБРАБОТЧИК ДВИЖЕНИЯ ШАРИКОВ
 *
 * Created with IntelliJ IDEA.
 * User: Baka
 * Date: 30.06.13
 * Time: 16:49
 * To change this template use File | Settings | File Templates.
 */

// В этом массиве хранятся шарики
var  balls = []; // Вынесен в область глобальных переменных, чтобы был доступ через кнопки

// Обработчик движения шариков
var flyingBalls = new function(ball) {

    var k = 20; // Множитель прироста скорости, введен, поскольку без него шарики летают медленнее, чем забрасываются пользователем


    // Общее движение
    function movement() {
        // Сначала обрабатываем столкновения
       for(var i = 0; i < balls.length - 1; i++)    {
            balls[i].coords = getCoords(balls[i]);

            for(var j = i+1; j < balls.length; j++){
                balls[j].coords = getCoords(balls[j]);


                //if(Math.sqrt(Math.pow((balls[i].coords.left + balls[i].radius) - (balls[j].coords.left + balls[j].radius),2) + Math.pow((balls[i].coords.top + balls[i].radius) - (balls[j].coords.top + balls[j].radius),2)) <= balls[i].radius + balls[j].radius) {
                if(Math.sqrt(Math.pow(balls[i].coords.xCenter - balls[j].coords.xCenter,2) + Math.pow(balls[i].coords.yCenter - balls[j].coords.yCenter,2)) <= balls[i].radius + balls[j].radius) {
                  impact(balls[i], balls[j], true);
                };
            };
        }

        for(var i = 0; i < balls.length; i++) {


            individualMovement(balls[i]);


        };

        // Если onunload не поддерживается, сохраняем в процессе
        if(!window.onunload){
            saver(balls);
        };
    };

    // Функция движения одного шара
    function individualMovement(ball) {

        // Если включена гравитация, обрабатываем ее воздействие на шарик
        if(document.getElementsByClassName('grav')[0].checked) gravitation(ball, balls);

        // Помещаем шарик на новые координаты
        ball.coords.left += k * ball.velocity.vx;
        ball.coords.top += k * ball.velocity.vy;

        ball.style.left = Math.round(ball.coords.left) + 'px';
        ball.style.top = Math.round(ball.coords.top) + 'px';

        ball.coords = getCoords(ball);
        var zone = document.body.getElementsByClassName("zone");
        var zoneCoords = getCoords(zone[0]);

        // Следим, чтобы шарик не выходил за пределы области, это самое важно, поэтому измение скорости на границе обрабатывается последним
        if(ball.coords.left <= zoneCoords.left + 6){
            ball.style.left = Math.round(zoneCoords.left) + 6 + 'px';
            ball.velocity.vx = Math.abs(ball.velocity.vx);
        };

        if(ball.coords.right >= zoneCoords.right - 6) {
            ball.style.left = Math.round(zoneCoords.right - 2 * ball.radius) - 6 + 'px';
            ball.velocity.vx = -Math.abs(ball.velocity.vx);
        };

        if(ball.coords.top <= zoneCoords.top + 6) {
            ball.style.top = Math.round(zoneCoords.top) + 6 + 'px';
            ball.velocity.vy = Math.abs(ball.velocity.vy);
        };

        if(ball.coords.bottom >= zoneCoords.bottom - 6) {
            ball.style.top = Math.round(zoneCoords.bottom - 2 * ball.radius) - 6                                                                      + 'px';
            ball.velocity.vy = -Math.abs(ball.velocity.vy);
        };

        //ball.coords = getCoords(ball);



       /*
       Здесь я пытался сделать движение менее дискретным, но возникли проблемы
       ball.coords = getCoords(ball);
        var zone = document.body.getElementsByClassName("zone");
        var zoneCoords = getCoords(zone[0]);

        var v = Math.sqrt(Math.pow(ball.velocity.vx,2) + Math.pow(ball.velocity.vy,2));

        var dx = ball.velocity.vx / v;
        var dy = ball.velocity.vy / v;

        if(document.getElementsByClassName('grav')[0].checked) gravitation(ball, balls);

        var zone = document.body.getElementsByClassName("zone");
        var zoneCoords = getCoords(zone[0]);

        var i = 0;

        while(i < 1){


            ball.coords = getCoords(ball);


            for(var i = 0; i < balls.length; i++){

                if(balls[i] == ball) continue;

                balls[i].coords = getCoords(balls[i]);



                if(Math.sqrt(Math.pow(balls[i].coords.xCenter - ball.coords.xCenter,2) + Math.pow(balls[i].coords.yCenter - ball.coords.yCenter,2)) <= balls[i].radius + ball.radius) {
                    impact(ball, balls[i], true);
                };
            };

            if(ball.coords.left <= zoneCoords.left){
                ball.velocity.vx = Math.abs(ball.velocity.vx);
                dx = Math.abs(dx);
            };

            if(ball.coords.right >= zoneCoords.right) {
                ball.velocity.vx = -Math.abs(ball.velocity.vx);
                dx = -Math.abs(dx);
            };

            if(ball.coords.top <= zoneCoords.top) {
                ball.velocity.vy = Math.abs(ball.velocity.vy);
                dy = Math.abs(dy);
            };

            if(ball.coords.bottom >= zoneCoords.bottom) {
                ball.velocity.vy = -Math.abs(ball.velocity.vy);
                dy = -Math.abs(dy);
            };

            ball.coords.left += 1 * dx;
            ball.coords.top += 1 * dy;

            ball.style.left = ball.coords.left + 'px';
            ball.style.top = ball.coords.top + 'px';

            i += 1/v;

        };   */


    };


    // Обработка столкновения
    function impact(ball1, ball2, flag){


        //Эта проверка включена на случай, если шары сблизившись, пройдут рядом по косательной,
        //или метод будет выван повторно до того, как они успеют разойтись после столкновения
        if(!isInImpact(ball1,ball2)) return;

        /// Копируем, чтобы не затирать свойства
        var impacted = {
            velocity: {
                vx: ball2.velocity.vx,
                vy: ball2.velocity.vy
            },
            radius: ball2.radius,
            coords: ball2.coords,
            mass: ball2.mass
        };

        // Повторный вызов функции для расчета изменения скорости второго шара.
        if(flag) {
           impact(ball2,ball1,false);
        };



        // Переход в систему отсчета центра шара self
        impacted.velocity.vx -= ball1.velocity.vx;
        impacted.velocity.vy -= ball1.velocity.vy;

        var dx = (impacted.coords.left + impacted.radius) - (ball1.coords.left + ball1.radius);
        var dy = (impacted.coords.top + impacted.radius) - (ball1.coords.top + ball1.radius);

        // Метод может быть вызван не в тот момент, когда растояние между центрами шаров будет точно равно двум радиусам, а когда они наползут друг на друга,
        // поэтому вычисляем действительное расстояние между ними для избежания потерь энергии.
        var rr = dx*dx + dy*dy;
        var r = Math.sqrt(rr);

        var vOrt = (impacted.velocity.vx * dx + impacted.velocity.vy * dy) / r; // При столкновении происходит обмен только перпендикулярной к косательной поверхности составляющей скоростей


        var newVelocity = 2 * impacted.mass * vOrt / (impacted.mass + ball1.mass); // Новая скорость шара в текущей системе отсчета



        // Возврат в прежднюю систему отсчета
        ball1.velocity.vx += newVelocity * dx / r;
        ball1.velocity.vy += newVelocity * dy / r;

    };

    //Проверяется, что сблизившиеся шары сталкиваются
    function isInImpact(ball1, ball2){
        var currentDistance = Math.sqrt(Math.pow((ball2.coords.left + ball2.radius) - (ball1.coords.left + ball1.radius),2) + Math.pow((ball2.coords.top + ball2.radius) - (ball1.coords.top + ball1.radius),2));
        var prognosedDistance = Math.sqrt(Math.pow((ball2.coords.left + ball2.radius + ball2.velocity.vx) - (ball1.coords.left + ball1.radius + ball1.velocity.vx),2) + Math.pow((ball2.coords.top + ball2.radius + ball2.velocity.vy) - (ball1.coords.top + ball1.radius + ball1.velocity.vy),2));

        return prognosedDistance < currentDistance;
    };

    // Принимаемновые шарики в область движения
    return function insertBall(ball){

        ball.coords = getCoords(ball); // Координаты шара

        // Определяем размер и массу шарика
        ball.radius = (ball.coords.right - ball.coords.left) / 2;
        ball.mass = Math.pow(ball.radius,3);

        // Добавляем объект в массив
        balls.push(ball);
        var n = balls.length - 1;

        // C добавлением первого шарика периодическая обработка движения
        if(n == 0) var timer = setInterval(function(){movement.call(self)}, 20);

        return;

    };


};

