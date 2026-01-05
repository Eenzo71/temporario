import { supabase } from './supabaseClient.js';

let historiaSendoEditada = null;

// PRECISA TER A PALAVRA "export" ANTES DE FUNCTION
export async function carregarHistoria() {
    const { data, error } = await supabase.from('historias').select('*');
    if (error) {
        console.error("Erro ao carregar história:", error);
        return;
    }
    if(data) {
        data.forEach(item => {
            const div = document.getElementById(`content-${item.usuario}`);
            if (div) div.innerHTML = item.conteudo;
        });
    }
    setupHomeEvents();
}

function setupHomeEvents() {
    document.querySelectorAll('.btn-edit-pencil').forEach(btn => {
        const novoBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(novoBtn, btn);
        novoBtn.addEventListener('click', () => {
            const usuario = novoBtn.getAttribute('onclick')?.match(/'([^']+)'/)[1] || 'nos'; 
            editarHistoria(usuario);
        });
    });

    const btnSalvar = document.querySelector('.btn-save-toolbar');
    const btnCancelar = document.querySelector('.btn-cancel-toolbar');
    
    if(btnSalvar) {
        const novoSalvar = btnSalvar.cloneNode(true);
        btnSalvar.parentNode.replaceChild(novoSalvar, btnSalvar);
        novoSalvar.addEventListener('click', salvarEdicaoAtual);
    }
    if(btnCancelar) {
        const novoCancelar = btnCancelar.cloneNode(true);
        btnCancelar.parentNode.replaceChild(novoCancelar, btnCancelar);
        novoCancelar.addEventListener('click', cancelarEdicao);
    }
}

function editarHistoria(usuario) {
    const toolbar = document.getElementById('toolbar-geral');
    if (toolbar) toolbar.style.display = 'flex';
    historiaSendoEditada = usuario;
    const divAlvo = document.getElementById(`content-${usuario}`);
    if (divAlvo) {
        divAlvo.contentEditable = true;
        divAlvo.classList.add('editing');
        divAlvo.focus();
    }
    document.querySelectorAll('.btn-edit-pencil').forEach(btn => btn.style.display = 'none');
}

async function salvarEdicaoAtual() {
    if (!historiaSendoEditada) return;
    const divAlvo = document.getElementById(`content-${historiaSendoEditada}`);
    const novoConteudo = divAlvo.innerHTML;
    const btnSalvar = document.querySelector('.btn-save-toolbar');
    if(btnSalvar) btnSalvar.innerText = 'Salvando...';

    const { error } = await supabase
        .from('historias')
        .update({ conteudo: novoConteudo })
        .eq('usuario', historiaSendoEditada);

    if (error) alert('Erro: ' + error.message);
    else { alert('Salvo!'); cancelarEdicao(); }
    if(btnSalvar) btnSalvar.innerText = '💾 Salvar';
}

function cancelarEdicao() {
    const toolbar = document.getElementById('toolbar-geral');
    if (toolbar) toolbar.style.display = 'none';
    const divAlvo = document.getElementById(`content-${historiaSendoEditada}`);
    if (divAlvo) {
        divAlvo.contentEditable = false;
        divAlvo.classList.remove('editing');
        carregarHistoria();
    }
    historiaSendoEditada = null;
    document.querySelectorAll('.btn-edit-pencil').forEach(btn => btn.style.display = 'inline-block');
}

window.formatar = function(comando, valor = null) {
    document.execCommand(comando, false, valor);
    const divAlvo = document.getElementById(`content-${historiaSendoEditada}`);
    if(divAlvo) divAlvo.focus();
};