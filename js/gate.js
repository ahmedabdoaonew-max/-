/* بوابة تسجيل الدخول للصفحات المستقلة (التي لا تحمّل app.js) */
(function () {
    if (typeof auth === 'undefined') { location.replace('login.html'); return; }
    var unsub = auth.onAuthStateChanged(function (u) {
        unsub();
        if (!u) { location.replace('login.html'); return; }
        var st = document.getElementById('authGateStyle');
        if (st) st.remove();
    });
})();
