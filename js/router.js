const rotas = {
    '/': 'home',
    '/login': 'login',
    '/home': 'home',
    '/galeria': 'galeria',
    '/lembrei': 'lembrei',
    '/museu': 'museu',
    '/constelacoes': 'constelacoes',
    '/em-breve': 'em-breve'
};

export function renderizarRota(path, acoesDePagina) {
    const rotaLimpa = path === '/' ? '/' : path.replace(/\/$/, "");
    const paginaID = rotas[rotaLimpa] || 'home';

    // 1. Background e Estilos
    if (paginaID === 'login') {
        document.body.style.backgroundImage = "url('imgs/log-back.jpeg')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
    } else if (paginaID === 'constelacoes') {
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "#090a0f";
    } else {
        document.body.style.backgroundImage = "url('imgs/fundo.png')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
    }

    // 2. Controla visibilidade (Menu, Header)
    const navBar = document.querySelector('.padrao');
    const menuLateral = document.getElementById('menu-lateral');
    const headerImgs = document.querySelector('.imgcntr');
    const headerUser = document.querySelector('.usuario');

    if (navBar) {
        navBar.style.display = 'flex';
        navBar.style.background = '';
        navBar.style.boxShadow = '';
        navBar.style.position = 'relative';
    }
    if (headerImgs) headerImgs.style.display = 'flex';
    if (headerUser) headerUser.style.display = 'block';

    if (paginaID === 'login') {
        if(navBar) navBar.style.display = 'none';
        if(menuLateral) menuLateral.style.display = 'none';
    } else if (paginaID === 'constelacoes') {
        if (headerImgs) headerImgs.style.display = 'none';
        if (headerUser) headerUser.style.display = 'none';
        if (navBar) {
            navBar.style.background = 'transparent';
            navBar.style.boxShadow = 'none';
            navBar.style.position = 'absolute';
            navBar.style.top = '0';
            navBar.style.width = '100%';
            navBar.style.zIndex = '100';
        }
    }

    // 3. Troca o conteúdo (Esconde/Mostra divs)
    document.querySelectorAll('.page-content').forEach(div => div.classList.remove('active'));
    const paginaAlvo = document.getElementById(`page-${paginaID}`);
    if (paginaAlvo) paginaAlvo.classList.add('active');

    // 4. Executa scripts específicos da página
    if (acoesDePagina[paginaID]) {
        acoesDePagina[paginaID]();
    }
    
    if (menuLateral) menuLateral.style.display = 'none';
}

export function navegarPara(path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event('rotaMudou'));
}