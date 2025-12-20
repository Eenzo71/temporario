// --- VARIÁVEIS GLOBAIS DA HOME ---
let historiaSendoEditada = null;

// --- CARREGAR HISTÓRIA (Leitura do Banco) ---
async function carregarHistoria() {
    // Busca na tabela 'historias'
    const { data, error } = await supabase.from('historias').select('*');
    
    if (error) {
        console.error("Erro ao carregar história:", error);
        return;
    }

    // Preenche as caixas de texto (Geral, Enzo e Brenda)
    data.forEach(item => {
        const div = document.getElementById(`content-${item.usuario}`);
        if (div) div.innerHTML = item.conteudo;
    });
}

// --- MODO DE EDIÇÃO (Clicou no Lápis) ---
function editarHistoria(usuario) {
    // Mostra a barra de ferramentas
    const toolbar = document.getElementById('toolbar-geral');
    if (toolbar) toolbar.style.display = 'flex';
    
    historiaSendoEditada = usuario;
    
    // Torna a div editável
    const divAlvo = document.getElementById(`content-${usuario}`);
    if (divAlvo) {
        divAlvo.contentEditable = true;
        divAlvo.classList.add('editing'); // Adiciona estilo visual
        divAlvo.focus();
    }
    
    // Esconde os lápis para não editar dois ao mesmo tempo
    document.querySelectorAll('.btn-edit-pencil').forEach(btn => btn.style.display = 'none');
}

// --- FORMATAÇÃO DE TEXTO (Negrito, Itálico, Cor...) ---
function formatar(comando, valor = null) {
    // Executa o comando do navegador
    document.execCommand(comando, false, valor);
    
    // Mantém o foco na caixa de texto
    const divAlvo = document.getElementById(`content-${historiaSendoEditada}`);
    if(divAlvo) divAlvo.focus();
}

// --- SALVAR NO SUPABASE ---
async function salvarEdicaoAtual() {
    if (!historiaSendoEditada) return;
    
    const divAlvo = document.getElementById(`content-${historiaSendoEditada}`);
    const novoConteudo = divAlvo.innerHTML;
    const btnSalvar = document.querySelector('.btn-save-toolbar');
    
    // Feedback visual no botão
    if(btnSalvar) btnSalvar.innerText = 'Salvando...';

    // Atualiza no banco de dados
    const { error } = await supabase
        .from('historias')
        .update({ conteudo: novoConteudo })
        .eq('usuario', historiaSendoEditada);

    if (error) {
        alert('Erro ao salvar: ' + error.message);
    } else {
        // Sucesso!
        alert('Salvo com sucesso! ❤️');
        cancelarEdicao();
    }
    
    if(btnSalvar) btnSalvar.innerText = '💾 Salvar';
}

// --- CANCELAR / SAIR DA EDIÇÃO ---
function cancelarEdicao() {
    // Esconde a barra
    const toolbar = document.getElementById('toolbar-geral');
    if (toolbar) toolbar.style.display = 'none';
    
    const divAlvo = document.getElementById(`content-${historiaSendoEditada}`);
    if (divAlvo) {
        divAlvo.contentEditable = false;
        divAlvo.classList.remove('editing');
        
        // Recarrega o conteúdo original para desfazer alterações não salvas
        carregarHistoria();
    }
    
    historiaSendoEditada = null;
    
    // Mostra os lápis de novo
    document.querySelectorAll('.btn-edit-pencil').forEach(btn => btn.style.display = 'inline-block');
}