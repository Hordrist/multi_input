$("body").on("mouseenter", ".tt-suggestion", function () {
    $(this).parent(".tt-dataset").find(".tt-cursor").removeClass("tt-cursor")
    $(this).addClass("tt-cursor")
}).on("mouseleave", ".tt-suggestion", function () {
    $(this).removeClass("tt-cursor")
})