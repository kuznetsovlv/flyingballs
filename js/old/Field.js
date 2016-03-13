/**
 *  Поле ввода
 * Created with IntelliJ IDEA.
 * User: Baka
 * Date: 05.08.13
 * Time: 11:25
 * To change this template use File | Settings | File Templates.
 */

var field = document.getElementById("textfield");    // Поле

// Обрабатываем изменение состояния поля
field.onchange = function(){

    // Эта функция помещает ползунок на слайдере в положение, соответсвующее полученному значению
    // Корректность значения проверяется внутри функции
    setThumpPosition(0.5 + (+field.value) / (200 * GMAX));

   // saver();  // Запоминаем изменение
    return false;
};