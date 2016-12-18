/**
 * Created by mihal on 18.12.2016.
 */
var temp;
$(document).ready(function() {
    $('.modal').modal();
    $('#logout').click(function() {logout()});
    $('button[name="login"]').click(function() {login(get_and_validate_login_data())});
    chrome.storage.sync.get("login_data", function(obj) {
        if (obj['login_data'] === undefined ||
            obj['login_data']['login'] === undefined ||
            obj['login_data']['password'] === undefined) {
            setTimeout(function() {
                display_page('login');
            }, 300);
        }
        else {
            fill_form(obj['login_data']['login'], obj['login_data']['password']);
            login({login: obj['login_data']['login'], password: obj['login_data']['password']});
        }
    })
});

function fill_form(login, pass) {
    $('input[name="username"]').val(login);
    $('input[name="password"]').val(pass);
}

function display_page(page) {
    $('.page').fadeOut("fast");
    $('#' + page + '-page').fadeIn("fast");
}


function get_and_validate_login_data() {
    var login_text = $('input[name="username"]').val();
    var pass_text = $('input[name="password"]').val();
    return {'login': login_text,
            'password': pass_text};
}

function login(credentials) {
    $('.page').fadeOut('fast');
    $('#loading-page').fadeIn('fast');
    $('#loading-text').html('Logging In...');
    $.ajax({
        type:"POST",
        xhrFields: { withCredentials: true },
        url: "https://ta.yrdsb.ca/yrdsb/index.php",
        data: $("#loginForm").serialize(),
        processData: false,
        success: function(msg) {
            var el = document.createElement('html');
            el.innerHTML = msg;
            response_content = $(el);
            if (isLogin(response_content)) {
                chrome.storage.sync.set({'login_data': {'login': credentials['login'], 'password': credentials['password']}}, function() {});
                $('#logout').fadeIn(1500);
                show_all_marks(response_content);
            }
            else {
                display_message('Login Error', 'Could not login: check student id and password');
                display_page('login');
            }
        }
    })
}

function logout() {
    chrome.storage.sync.clear();
    $('#logout').fadeOut(1500);
    display_page('login');
}

function show_all_marks(response) {
    var courses = response.find('table[width="85%"] tr').slice(1);
    for (var i = 0; i < courses.length; i++) {
        var course = $(courses.get(i));
        var course_name = /\w{3}[\d\w]\w\d-\d{2}\s:\s(\w+\s)*/g.exec(course.find('td').get(0).innerHTML)[0];
        var course_score = /\d{1,3}\.*\d{0,2}%/g.exec(course.find('td').get(2).innerHTML);
        if (course_score != null) {
            course_score = course_score[0];
        } else {
            course_score = "Please see teacher for current status regarding achievement in the course";
        }
        var course_html = "<div class='course'><h6>" + course_name + "</h6><p>" + course_score + "</p>";
        $('#marks-page').append($(course_html));
    }
    display_page("marks");
}

function isLogin(response) {
    var status = response.find('title').html();
    console.log(status);
    return (status === 'Student Reports');
}

function display_message(title, content) {
    $('#modal_header').html(title);
    $('#modal_content').html(content);
    $('#modal_main').modal('open');
}