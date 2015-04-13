$(function() {
    var confirmDelete = true, activeDelete;
    $(document).on('click','#confirm-delete a',function(ev) {
        var resp = $(this).attr('href');
        ev.preventDefault();
        if (/n/.test(resp)) {
            $('#confirm-delete').hide();
        } else {
            if (/yy/.test(resp)) {
                confirmDelete = false;
            }
            deleteFavorite(activeDelete);
        }
    });
    $(document).on('click',".rm-favorite",function(ev) {
        var el = $(this);
        ev.preventDefault();
        if (confirmDelete) {
            activeDelete = el;
            $('#confirm-delete').removeClass('hide').appendTo(el.closest('li')).show();
        } else {
            deleteFavorite(el);
        }
    });
    function deleteFavorite(el) {
        $.post(el.attr('href'), function() {
            el.closest('li').fadeOut();
        });
        activeDelete = null;
    }
    function showSuccess() {
        $('#add-to-feedback').html('Successfully Added').fadeTo(0,1).fadeTo(2000, 0);
    }
    $(".add-to-favorites").click(function(ev) {
        var el = $(this);
        ev.preventDefault();
        $.post(el.attr('href'),showSuccess);
    });
    $(".add-to-map").click(function(ev) {
        var el = $(this);
        ev.preventDefault();
        $.post(el.attr('href'),showSuccess);
    });
});