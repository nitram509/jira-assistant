import $ from 'jquery'

export function unselectable(jQueryElement) {
    jQueryElement.each(function () {
        $(this).addClass("unselectable").attr("unselectable", "on");
    });
    return jQueryElement;
}

export function clearUnselectable(jQueryElement) {
    jQueryElement.each(function () {
        $(this).removeClass("unselectable").removeAttr("unselectable");
    });
    return $(jQueryElement);
}