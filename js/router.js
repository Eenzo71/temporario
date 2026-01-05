// js/router.js

// Mapeamento de rotas para funções de carregamento (serão injetadas pelo app.js)
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

// Função que atualiza a visualização baseada na rota
export function renderizarRota(path, acoesDePagina) {
    // Normaliza a rota (ex: remove barra final se tiver)
    const rotaLimpa = path === '/' ? '/' : path.replace(/\/$/, "");
    
    // Descobre qual é a "página" (id da div)
    const paginaID = rotas[rotaLimpa] || 'home'; // Default para home se não achar

    // 1. Lógica de Background (copiada do seu app.js original)
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

    // 2. Controle Visual (Menu/Avatar)
    const navBar = document.querySelector('.padrao');
    const menuLateral = document.getElementById('menu-lateral');
    const headerImgs = document.querySelector('.imgcntr');
    const headerUser = document.querySelector('.usuario');

    // Reset
    if (navBar) {
        navBar.style.display = 'flex';
        navBar.style.background = '';
        navBar.style.boxShadow = '';
        navBar.style.position = 'relative';
    }
    if (headerImgs) headerImgs.style.display = 'flex';
    if (headerUser) headerUser.style.display = 'block';

    // Regras específicas
    if (paginaID === 'login') {
        if(navBar) navBar.style.display = 'none';
        if(menuLateral) menuLateral.style.display = 'none';
    } 
    else if (paginaID === 'constelacoes') {
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

    // 3. Troca de Conteúdo (Esconde/Mostra Divs)
    document.querySelectorAll('.page-content').forEach(div => div.classList.remove('active'));
    const paginaAlvo = document.getElementById(`page-${paginaID}`);
    if (paginaAlvo) paginaAlvo.classList.add('active');

    // 4. Executa a função específica da página (ex: carregarGaleria)
    if (acoesDePagina[paginaID]) {
        acoesDePagina[paginaID]();
    }
    
    // Fecha menu se estiver aberto
    if (menuLateral) menuLateral.style.display = 'none';
}

// Função para navegar via código (History API)
export function navegarPara(path) {
    window.history.pushState({}, "", path);
    // Dispara um evento customizado para avisar o app.js que a rota mudou
    window.dispatchEvent(new Event('rotaMudou'));
}