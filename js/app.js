// --- 1. CONFIGURAÇÃO DO SUPABASE (Global) ---
const SUPABASE_URL = 'https://pzgtlgdjofwzsmlflghp.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6Z3RsZ2Rqb2Z3enNtbGZsZ2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NjgzNTksImV4cCI6MjA4MTE0NDM1OX0.jfsOHphuLB86iewCZLXomz3xKsx3d2ig307j8u2G-9k'; 

// [CORREÇÃO AQUI] 
// Não usamos 'const supabase', pois o nome já existe.
// Criamos o cliente e jogamos dentro da variável global window.supabase
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = client; 

// --- 2. NAVEGAÇÃO SPA (O Roteador) ---
async function navegarPara(pagina, tituloExtra = '') {
    // Verifica se o usuário ainda está logado
    const { data: { session } } = await window.supabase.auth.getSession();

    // Proteção de Rota
    if (!session && pagina !== 'login') {
        navegarPara('login'); 
        return; 
    }

    // Se for login, usa o background do login. Se não, usa o fundo padrão.
    if (pagina === 'login') {
        document.body.style.backgroundImage = "url('imgs/log-back.jpeg')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed"; // Para não mover ao rolar
    } else if (pagina === 'constelacoes') {
        // Nas constelações, removemos a imagem do body para o degradê escuro da div brilhar
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "#090a0f"; // Fundo preto espacial
    } else {
        // Para todas as outras páginas (Home, Galeria, Museu...)
        document.body.style.backgroundImage = "url('imgs/fundo.png')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundAttachment = "fixed";
        document.body.style.backgroundPosition = "center";
    }

    // --- CONTROLE VISUAL (Header, Menu, Avatar) ---
    const navBar = document.querySelector('.padrao');
    const menuLateral = document.getElementById('menu-lateral'); // Corrigido para buscar por ID
    const headerImgs = document.querySelector('.imgcntr');
    const headerUser = document.querySelector('.usuario');
    
    // 1. Reset: Mostra tudo por padrão (comportamento normal)
    if (navBar) {
        navBar.style.display = 'flex';
        navBar.style.background = ''; // Volta ao CSS original
        navBar.style.boxShadow = '';
        navBar.style.position = 'relative'; 
    }
    if (headerImgs) headerImgs.style.display = 'flex';
    if (headerUser) headerUser.style.display = 'block';

    // 2. Regras Específicas por Página
    if (pagina === 'login') {
        // No login, esconde tudo
        if(navBar) navBar.style.display = 'none';
        if(menuLateral) menuLateral.style.display = 'none';
    } 
    else if (pagina === 'constelacoes') {
        // MODO IMERSIVO: Esconde fotos e avatar para focar no céu
        if (headerImgs) headerImgs.style.display = 'none';
        if (headerUser) headerUser.style.display = 'none';
        
        // Deixa a barra de navegação transparente e flutuante
        if (navBar) {
            navBar.style.background = 'transparent'; 
            navBar.style.boxShadow = 'none';
            navBar.style.position = 'absolute'; 
            navBar.style.top = '0';
            navBar.style.width = '100%';
            navBar.style.zIndex = '100';
        }
    }

    // Título dinâmico para a página "Em Breve"
    if (pagina === 'em-breve') {
        const tituloEl = document.getElementById('titulo-em-breve');
        if (tituloEl) {
            tituloEl.innerText = tituloExtra ? `${tituloExtra} (Em Breve...)` : 'Em Breve...';
        }
    }

    // --- TROCA DE CONTEÚDO ---
    // Esconde todas as páginas
    document.querySelectorAll('.page-content').forEach(div => {
        div.classList.remove('active');
    });

    // Mostra a página alvo
    const paginaAlvo = document.getElementById(`page-${pagina}`);
    if (paginaAlvo) paginaAlvo.classList.add('active');

    // --- CARREGAMENTO DINÂMICO DOS SCRIPTS ---
    // Aqui o app.js chama as funções dos outros arquivos que criamos
    
    if (pagina === 'home' && typeof carregarHistoria === 'function') carregarHistoria();
    
    if (pagina === 'galeria' && typeof carregarGaleria === 'function') carregarGaleria();
    
    if (pagina === 'lembrei' && typeof carregarLembretes === 'function') carregarLembretes();
    
    if (pagina === 'museu' && typeof carregarMuseu === 'function') carregarMuseu();
    
    if (pagina === 'constelacoes') {
        if (typeof gerarCeuEstrelado === 'function') gerarCeuEstrelado();
        if (typeof carregarConstelacoes === 'function') carregarConstelacoes();
    }

    // Fecha o menu lateral se estiver aberto
    if (menuLateral && menuLateral.style.display === 'block') {
        menuLateral.style.display = 'none';
    }
}

// --- 3. EVENTOS DE LOGIN E INICIALIZAÇÃO ---

// Botão de Login
const btnLogin = document.getElementById('btn-entrar-supa');
if (btnLogin) {
    btnLogin.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const originalText = btnLogin.innerHTML;
        
        btnLogin.innerHTML = '...';
        
        const { error } = await window.supabase.auth.signInWithPassword({ email, password: senha });
        
        if (error) {
            alert('Erro: ' + error.message);
            btnLogin.innerHTML = originalText;
        } else {
            navegarPara('home');
        }
    });
}

// Quando o site carrega pela primeira vez
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- LÓGICA DO MENU LATERAL (CORRIGIDA) ---
    const btnMenu = document.getElementById('btnbrrlft');
    const menuLateral = document.getElementById('menu-lateral'); 

    if(btnMenu && menuLateral) {
        // Garante que o menu comece fechado
        if (!menuLateral.style.display) menuLateral.style.display = 'none';

        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita bugs de clique duplo
            
            // Lógica simples de alternar (Toggle)
            if (menuLateral.style.display === 'none' || menuLateral.style.display === '') {
                menuLateral.style.display = 'block';
                console.log("Menu aberto!");
            } else {
                menuLateral.style.display = 'none';
                console.log("Menu fechado!");
            }
        });

        // Fechar o menu se clicar fora dele
        document.addEventListener('click', (e) => {
            if (menuLateral.style.display === 'block' && 
                !menuLateral.contains(e.target) && 
                !btnMenu.contains(e.target)) {
                menuLateral.style.display = 'none';
            }
        });
    }

    // --- VERIFICAÇÃO DE LOGIN ---
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session) {
        navegarPara('home');
    } else {
        navegarPara('login');
    }

    // --- INICIAR PLAYER ---
    if (typeof carregarPlaylist === 'function') {
        carregarPlaylist();
    }
});