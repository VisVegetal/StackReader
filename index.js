const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8000;

var vect_foldere = ['temp', 'logs', 'backup', 'fisiere_uploadate'];
for (const nume of vect_foldere) {
    var cale = path.join(__dirname, nume);
    if (!fs.existsSync(cale)) {
        fs.mkdirSync(cale);
    }
}

var obGlobal = {
    obErori: null
};

function initErori() {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'erori.json'), 'utf-8'));
    const caleBaza = raw.cale_baza;
    for (const e of raw.info_erori) {
        e.imagine = caleBaza + e.imagine;
    }
    raw.eroare_default.imagine = caleBaza + raw.eroare_default.imagine;
    obGlobal.obErori = raw;
}

initErori();

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    if (req.path.endsWith('.ejs')) {
        return afisareEroare(res, 400);
    }
    next();
});

app.use(express.static(__dirname));

app.use('/resurse', (req, res, next) => {
    if (!req.path.includes('.')) {
        return afisareEroare(res, 403);
    }
    next();
});

app.use((req, res, next) => {
    res.locals.ip = req.ip;
    next();
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse', 'ico', 'favicon', 'favicon.ico'));
});

app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index', { title: 'StackReader - Librăria Ta Digitală' });
});

function afisareEroare(res, identificator, titlu, text, imagine) {
    var baza;
    var codStatus = 200;

    if (identificator != null) {
        var gasit = null;
        for (const e of obGlobal.obErori.info_erori) {
            if (e.identificator === identificator) {
                gasit = e;
                break;
            }
        }
        if (gasit) {
            baza = gasit;
            if (gasit.status) codStatus = identificator;
        } else {
            baza = obGlobal.obErori.eroare_default;
        }
    } else {
        baza = obGlobal.obErori.eroare_default;
    }

    var eroareData = {
        titlu: titlu != null ? titlu : baza.titlu,
        text: text != null ? text : baza.text,
        imagine: imagine != null ? imagine : baza.imagine
    };

    res.status(codStatus).render('pagini/eroare', {
        title: eroareData.titlu,
        eroare: eroareData
    });
}

app.use((req, res, next) => {
    if (req.method !== 'GET') return next();

    var page = req.path.split('/').filter(Boolean).join('/');
    if (!page) return next();

    res.render('pagini/' + page, { title: page.charAt(0).toUpperCase() + page.slice(1) + ' - StackReader' }, (err, html) => {
        if (err) {
            if (err.message && err.message.startsWith('Failed to lookup view')) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res, 500);
            }
        } else {
            res.send(html);
        }
    });
});

console.log(`__dirname: ${__dirname}`);
console.log(`__filename: ${__filename}`);
console.log(`process.cwd(): ${process.cwd()}`);

app.listen(PORT, () => {
    console.log(`Serverul a pornit! Deschide în browser: http://localhost:${PORT}`);
});