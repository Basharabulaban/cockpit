import $ from "jquery";
import cockpit from "cockpit";

$(function() {
    $("#hammer").on("click", function () { $(this).hide() });

    $(".cockpit-internal-reauthorize .pf-c-button").on("click", function() {
        $(".cockpit-internal-reauthorize span").text("checking...");
        var cmd = "pkcheck --action-id org.freedesktop.policykit.exec --process $$ -u 2>&1";
        cockpit.spawn(["sh", "-c", cmd])
                .stream(function(data) {
                    console.debug(data);
                })
                .done(function() {
                    $(".cockpit-internal-reauthorize span").text("result: authorized");
                })
                .fail(function() {
                    $(".cockpit-internal-reauthorize span").text("result: access-denied");
                });
    });

    $(".super-channel .pf-c-button").on("click", function() {
        $(".super-channel span").text("checking...");
        cockpit.spawn(["id"], { superuser: true })
                .done(function(data) {
                    console.log("done");
                    $(".super-channel span").text("result: " + data);
                })
                .fail(function(ex) {
                    console.log("fail");
                    $(".super-channel span").text("result: " + ex.problem);
                });
    });

    $(".lock-channel .pf-c-button").on("click", function() {
        $(".lock-channel span").text("locking...");
        cockpit.spawn(["flock", "-o", "/tmp/playground-test-lock", "-c", "echo locked; sleep infinity"],
                      { err: "message" })
                .stream(function(data) {
                    $(".lock-channel span").text(data);
                })
                .fail(function(ex) {
                    $(".lock-channel span").text("failed: " + ex.toString());
                });
    });

    function update_nav() {
        $('#nav').empty();
        var path = ["top"].concat(cockpit.location.path);
        $(path).each(function (i, p) {
            if (i < path.length - 1) {
                $('#nav').append(
                    $('<a tabindex="0">')
                            .text(p)
                            .click(function () {
                                cockpit.location.go(path.slice(1, i + 1));
                            }),
                    " >> ");
            } else {
                $('#nav').append(
                    $('<span>').text(p));
            }
        });
    }

    $(cockpit).on('locationchanged', update_nav);
    update_nav();

    $('#go-down').click(function () {
        var len = cockpit.location.path.length;
        cockpit.location.go(cockpit.location.path.concat(len.toString()), { length: len.toString() });
    });

    var counter = cockpit.file("/tmp/counter", { syntax: JSON });

    function normalize_counter(obj) {
        obj = obj || { };
        obj.counter = obj.counter || 0;
        return obj;
    }

    function complain(error) {
        $('#file-error').text(error.toString());
    }

    function changed(content, tag, error) {
        if (error)
            return complain(error);
        $('#file-content').text(normalize_counter(content).counter);
        $('#file-error').empty();
    }

    counter.watch(changed);

    $('#modify-file').click(function () {
        counter
                .modify(function (obj) {
                    obj = normalize_counter(obj);
                    obj.counter += 1;
                    return obj;
                })
                .fail(complain);
    });

    function load_file() {
        cockpit.file("/tmp/counter").read()
                .done(function (content) {
                    $('#edit-file').val(content);
                });
    }

    function save_file() {
        cockpit.file("/tmp/counter").replace($('#edit-file').val());
    }

    $('#load-file').click(load_file);
    $('#save-file').click(save_file);
    load_file();

    $('#delete-file').click(function () {
        cockpit.spawn(["rm", "-f", "tmp/counter"]);
    });

    $("body").prop("hidden", false);

    function show_hidden() {
        $("#hidden").text(cockpit.hidden ? "hidden" : "visible");
    }

    $(cockpit).on("visibilitychange", show_hidden);
    show_hidden();
});
