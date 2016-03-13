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

var panelElem = document.getElementById("panel");
// Объект, определяющий, допустимые границы для движения шарика
var zoneCoords = {

    get left(){return getCoords(panelElem).right;},
    get right(){return document.documentElement.clientWidth;},

    get top(){return 0;},
    get bottom(){return document.documentElement.clientHeight;}

};

// Обработчик движения шариков
var flyingBalls = new function() {







    // Принимаемновые шарики в область движения
    this.insertBall = function (ball){

        ball.position = function(){return getCoords(this)};  // Текущая позиция шарика

        // Определяем размер и массу шарика
        ball.radius = (ball.position().right - ball.position().left) / 2;
        ball.mass = Math.pow(ball.radius,3);

        ball.distance = function(ball){

            return Math.sqrt(Math.pow(this.position().center.x - ball.position().center.x, 2) + Math.pow(this.position().center.y - ball.position().center.y, 2));
        };


        // Шаг мувмента до столкновения, либо окончания мувмента
        ball.step = function(a /*Параметр a используется для задания доли смещения*/){

            //Совершаем движение
            this.style.left = Math.round(this.position().left + a * this.velocity.vx) + 'px';
            this.style.top = Math.round(this.position().top + a * this.velocity.vy) + 'px';



            // Проверяем, что шарик не вылетел за границы зоны, если требуется, возвращаем его в зону
            if(this.position().left <= zoneCoords.left){
                this.style.left = Math.round(zoneCoords.left) + 'px';
                this.velocity.vx = Math.abs(this.velocity.vx);

            };

            if(this.position().right >= zoneCoords.right) {
                this.style.left = Math.round(zoneCoords.right - 2 * this.radius) + 'px';
                this.velocity.vx = -Math.abs(this.velocity.vx);
            };

            if(this.position().top <= zoneCoords.top) {
                this.style.top = Math.round(zoneCoords.top) + 'px';
                this.velocity.vy = Math.abs(this.velocity.vy);
            };

            if(this.position().bottom >= zoneCoords.bottom) {
                this.style.top = Math.round(zoneCoords.bottom - 2 * this.radius) + 'px';
                this.velocity.vy = -Math.abs(this.velocity.vy);
            };

            // Проверяем, не произошло ли столкновение с другим шариком, если произошло, обрабатываем его
            for(var i = 0; i < balls.length; i++){
                if(balls[i] === this) return;

                if(this.distance(balls[i]) <= this.radius + balls[i].radius) this.impact(balls[i], true);
            };
        };

        ball.movRes = 1; // Счетчик оставшейся доли текущего мувмента

        // Начало текущего мувмента
        ball.movement = function(){
            this.movRes = 1;
            this.move(1);
        };

        // Обработчик движения
        ball.move =    function(a /*Параметр a используется для задания доли смещения*/){



            // Определяем размер шага от оставшегося мувмента.
            // Сначала сравниваем остаток предстоящего смещения с растоянием до границы
            var k = (zoneCoords.left - this.position().left) / (a * this.velocity.vx);
            a = 0 < k && k < a ? k : a;

            k = (zoneCoords.right - this.position().right) / (a * this.velocity.vx);
            a = 0 < k && k < a ? k : a;

            k = (zoneCoords.top - this.position().top) / (a * this.velocity.vy);
            a = 0 < k && k < a ? k : a;

            k = (zoneCoords.bottom - this.position().bottom) / (a * this.velocity.vy);
            a = 0 < k && k < a ? k : a;

            k = this.getA(a); //Ищем на пути ближайший шарик
            a = 0 < k && k < a ? k : a;

            this.step(a); // Делаем шаг

            this.movRes -= a; // Уменьшаем долю предстоящего смещения


            // Если мувмент не закончился, делаем еще один шаг
            if(this.movRes > 0) this.move(this.movRes);

        };

        // Обработка столкновения
        ball.impact = function(ball, flag){

           if(!this.isInImpact(ball)) return;  // Убеждаемся, что шарики действительно сталкиваются, а не остановились в такой близости из-за нехватки мувмента

            // Сохраняем скорость другого шарика
            var impacted = {
                vx: ball.velocity.vx,
                vy: ball.velocity.vy
            };

            // Переход в систему отсчета центра шара self
            impacted.vx -= this.velocity.vx;
            impacted.vy -= this.velocity.vy;

            var dx = ball.position().center.x - this.position().center.x;
            var dy = ball.position().center.y - this.position().center.y;

            // Метод может быть вызван не в тот момент, когда растояние между центрами шаров будет точно равно двум радиусам, а когда они наползут друг на друга,
            // поэтому вычисляем действительное расстояние между ними для избежания потерь энергии.
            var rr = dx*dx + dy*dy;
            var r = Math.sqrt(rr);

            var vOrt = (impacted.vx * dx + impacted.vy * dy) / r; // При столкновении происходит обмен только перпендикулярной к косательной поверхности составляющей скоростей

            var newVelocity = 2 * ball.mass * vOrt / (ball.mass + this.mass); // Новая скорость шара в текущей системе отсчета

            if(flag) ball.impact(this, false);  // Перед записью новых знчений скорости, производим аналогичные изменения для другого шарика

            // Возврат в прежднюю систему отсчета
            this.velocity.vx += newVelocity * dx / r;
            this.velocity.vy += newVelocity * dy / r;



        };


       // Определяем оставшуюся долю мувмента до столкновения с другим шариком
        ball.getA = function(a){

            var x0 = this.position().center.x;
            var y0 = this.position().center.y;
            var x = x0;
            var y = y0;

            // Проверяем отрезок, по которому потенциально будет двигаться центр шарика
            for(var x = x0; x <= Math.round(x0 + a * this.velocity.vx); x++){
                 y = (x - x0)  * this.velocity.vy / this.velocity.vx + y0;

                for(var i = 0; i < balls.length; i++){
                    if(balls[i] === this) continue;
                    // Если на участке движения есть шарик, с которым текущий сблизится ближе суммы их радиусов, возвращается доля мувмента до их столкновения
                    if((Math.sqrt(Math.pow(x - balls[i].position().center.x, 2) + Math.pow(y - balls[i].position().center.y, 2)) <= this.radius + balls[i].radius) && (this.distance(balls[i]) > this.radius + balls[i].radius)){

                        return Math.sqrt((Math.pow(x-x0,2) + Math.pow(y-y0,2)) / (Math.pow(this.velocity.vx,2) + Math.pow(this.velocity.vy,2)));
                    };
                };
            };

            return a;  // Иначе возвращается полученная доля мувмента
        };

        // Проверяем, что шарики находятся в столкновнии
        // Если небольшое смещение вдоль текущих их скоростей приводит к уменьшению растояния между центрами, это столкновение
        ball.isInImpact = function(ball){

            var k = 0.00001;

            var prognosedDistance = Math.sqrt(Math.pow(this.position().center.x + k * this.velocity.vx - ball.position().center.x - k * ball.velocity.vx, 2) + Math.pow(this.position().center.y  + k * this.velocity.vy - ball.position().center.y - k * ball.velocity.vy, 2));
                               //alert(prognosedDistance - this.distance(ball));
            return prognosedDistance <= this.distance(ball);
        };



        // Добавляем объект в массив
        balls.push(ball);


        // C добавлением первого шарика периодическая обработка движения
        if(balls.length == 1) {
            clearInterval(timer);  //Прекращаем следить за размером панели, теперь это будет происходить при обработке движения
            timer = setInterval(function(){movement();}, 50);
        };
    };

    function movement(){

        // Если включена гравитация, обрабатываем ее воздействие на шарик
        if(document.getElementsByClassName('grav')[0].checked){

            for(var i = 0; i < balls.length; i++){
                gravRungeKutta4(balls[i]);
            };
        };

        // Для каждого шарика вызываем обработчик движения
        for(var i = 0; i < balls.length; i++){

            balls[i].movement();
        };


    };





};


