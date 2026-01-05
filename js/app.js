// js/app.js - ARQUIVO PRINCIPAL
import { supabase } from './supabaseClient.js';
import { renderizarRota, navegarPara } from './router.js';

// Importando as funcionalidades das páginas
import { carregarHistoria } from './home.js';
import { carregarGaleria, setupGaleria } from './galeria.js';
import { carregarLembretes, setupLembrei } from './lembrei.js';
import { carregarMuseu, setupMuseu } from './museu.js';
import { gerarCeuEstrelado, carregarConstelacoes, setupConstelacoes } from './constelacoes.js';

// --- CORREÇÃO DE COMPATIBILIDADE ---
// Isso garante que o 'player.js' (que não é módulo) consiga ver o supabase
window.supabase = supabase; 

// Mapa de ações para cada página
// Sempre que a rota mudar, ele roda a função correspondente
const acoesDePagina = {
    'home': () => { carregarHistoria(); },
    'galeria': () => { carregarGaleria(); setupGaleria(); },
    'lembrei': () => { carregarLembretes(); setupLembrei(); },
    'museu': () => { carregarMuseu(); setupMuseu(); },
    'constelacoes': () => { gerarCeuEstrelado(); carregarConstelacoes(); setupConstelacoes(); },
    'login': () => { /* Lógica de login específica se houver */ }
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Verifica Sessão
    const { data: { session } } = await supabase.auth.getSession();
    
    // Se não logado, manda pro login (mas permite ficar no login se já estiver lá)
    if (!session && window.location.pathname !== '/login') {
        navegarPara('/login');
        renderizarRota('/login', acoesDePagina);
    } else {
        // Se já tem sessão, carrega a rota que está na URL
        renderizarRota(window.location.pathname, acoesDePagina);
    }

    // 2. Setup do Menu Lateral
    setupMenuLateral();

    // 3. Interceptação de Links (Para usar o History API e não dar refresh)
    document.body.addEventListener('click', (e) => {
        // Verifica se clicou num link do nosso site (começa com /)
        const link = e.target.closest('a');
        if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('/')) {
            e.preventDefault(); // Não recarrega a página
            navegarPara(link.getAttribute('href')); // Troca a URL virtualmente
        }
    });

    // 4. Setup do Login (Evento)
    const btnLogin = document.getElementById('btn-entrar-supa');
    if (btnLogin) {
        btnLogin.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const btnTextoOriginal = btnLogin.innerHTML;
            
            btnLogin.innerHTML = '...';
            const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
            
            if (error) {
                alert('Erro: ' + error.message);
                btnLogin.innerHTML = btnTextoOriginal;
            } else {
                navegarPara('/home');
            }
        });
    }

    // 5. Iniciar Playlist (Se o player.js já tiver carregado)
    if (typeof carregarPlaylist === 'function') {
        carregarPlaylist();
    }
});

// --- OUVINTES DE ROTA (HISTORY API) ---

// Quando o usuário clica em "Voltar" ou "Avançar" no navegador
window.addEventListener('popstate', () => {
    renderizarRota(window.location.pathname, acoesDePagina);
});

// Evento customizado disparado pela função navegarPara
window.addEventListener('rotaMudou', () => {
    renderizarRota(window.location.pathname, acoesDePagina);
});

// Função auxiliar do menu
function setupMenuLateral() {
    const btnMenu = document.getElementById('btnbrrlft');
    const menuLateral = document.getElementById('menu-lateral'); 
    if(btnMenu && menuLateral) {
        // Garante estado inicial
        menuLateral.style.display = 'none';

        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            menuLateral.style.display = (menuLateral.style.display === 'block') ? 'none' : 'block';
        });
        document.addEventListener('click', (e) => {
            if (menuLateral.style.display === 'block' && !menuLateral.contains(e.target) && !btnMenu.contains(e.target)) {
                menuLateral.style.display = 'none';
            }
        });
    }
}