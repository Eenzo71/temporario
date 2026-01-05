// js/app.js - ARQUIVO PRINCIPAL

import { supabase } from './supabaseClient.js';
import { renderizarRota, navegarPara } from './router.js';

// Importando as funcionalidades das páginas
import { carregarHistoria } from './home.js';
import { carregarGaleria, setupGaleria } from './galeria.js';
import { carregarLembretes } from './lembrei.js'; // Você precisa adaptar o lembrei.js
import { carregarMuseu } from './museu.js'; // Você precisa adaptar o museu.js
import { gerarCeuEstrelado, carregarConstelacoes } from './constelacoes.js'; // Adaptar constelacoes.js

// Mapa de ações para cada página
const acoesDePagina = {
    'home': () => { carregarHistoria(); },
    'galeria': () => { carregarGaleria(); setupGaleria(); },
    'lembrei': () => { carregarLembretes(); },
    'museu': () => { carregarMuseu(); },
    'constelacoes': () => { gerarCeuEstrelado(); carregarConstelacoes(); },
    'login': () => { /* Lógica de login se tiver algo específico */ }
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Verifica Sessão
    const { data: { session } } = await supabase.auth.getSession();
    
    // Se não logado, força login (exceto se já estiver lá)
    if (!session && window.location.pathname !== '/login') {
        navegarPara('/login');
        renderizarRota('/login', acoesDePagina);
    } else {
        // Renderiza a rota inicial baseada na URL atual
        renderizarRota(window.location.pathname, acoesDePagina);
    }

    // 2. Setup do Menu Lateral
    setupMenuLateral();

    // 3. Interceptação de Links (Para não recarregar a página)
    document.body.addEventListener('click', (e) => {
        // Verifica se clicou em um link <a href="...">
        const link = e.target.closest('a');
        if (link && link.getAttribute('href').startsWith('/')) {
            e.preventDefault();
            navegarPara(link.getAttribute('href'));
        }
    });

    // 4. Setup do Login (Evento)
    const btnLogin = document.getElementById('btn-entrar-supa');
    if (btnLogin) {
        btnLogin.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            
            const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
            if (error) alert('Erro: ' + error.message);
            else navegarPara('/home');
        });
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