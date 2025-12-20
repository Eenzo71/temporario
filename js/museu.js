// --- VARIÁVEIS GLOBAIS DO MUSEU ---
let idMuseuEditando = null; // Controla se estamos criando ou editando

// --- CARREGAR A LINHA DO TEMPO (READ) ---
async function carregarMuseu() {
    const container = document.getElementById('timeline-container');
    
    // Se não estiver na página do museu, para aqui
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:#888;">Polindo as relíquias...</p>';

    // Busca no banco ordenado por data (do mais antigo para o mais novo ou vice-versa)
    const { data, error } = await supabase
        .from('museu')
        .select('*')
        .order('data_acontecimento', { ascending: true }); // True = ordem cronológica

    if (error || !data) {
        container.innerHTML = '<p style="text-align:center;">Erro ao carregar o museu.</p>';
        console.error(error);
        return;
    }
    
    container.innerHTML = ''; // Limpa carregamento

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">O museu está vazio. Comece a sua história! 🏛️</p>';
        return;
    }

    // Monta a linha do tempo (Esquerda / Direita)
    data.forEach((item, index) => {
        const lado = (index % 2 === 0) ? 'left' : 'right'; // Alterna os lados
        const dataFormatada = new Date(item.data_acontecimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        // Verifica se tem imagem
        let imgHtml = '';
        if (item.url_midia) {
            imgHtml = `<img src="${item.url_midia}" class="museu-img-preview" alt="Relíquia" loading="lazy">`;
        }

        const descPreview = item.descricao || "Sem descrição.";

        const div = document.createElement('div');
        div.className = `timeline-item ${lado}`;

        // O HTML do Cartão
        // Note o onclick: ele passa o objeto 'item' inteiro para o modal
        div.innerHTML = `
            <div class="content" onclick='abrirModalMuseu(${JSON.stringify(item)})'>
                <span class="date">${dataFormatada}</span>
                <h2>${item.titulo}</h2>
                <div class="museu-desc-preview">${descPreview}</div>
                ${imgHtml}
                <div style="margin-top: 10px; color: #d81b60; font-size: 0.8rem; font-weight: bold; text-align: center;">
                    Ver memória completa ✨
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// --- FORMULÁRIO: ADICIONAR OU EDITAR (CREATE / UPDATE) ---

const btnAddMuseu = document.getElementById('btn-add-museu');
const formMuseu = document.getElementById('form-museu');

// 1. Botão de Alternar (Novo vs Cancelar)
if (btnAddMuseu) {
    btnAddMuseu.addEventListener('click', () => {
        // Se clicar no botão principal, resetamos para MODO CRIAÇÃO
        idMuseuEditando = null;
        formMuseu.reset();
        document.getElementById('btn-salvar-museu').innerText = 'Eternizar Momento';
        
        const isVisible = formMuseu.style.display === 'block';
        formMuseu.style.display = isVisible ? 'none' : 'block';
        btnAddMuseu.innerText = isVisible ? '+ Adicionar Relíquia' : 'Cancelar X';
    });
}

// 2. Enviar Formulário
if (formMuseu) {
    formMuseu.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btn-salvar-museu');
        const titulo = document.getElementById('museu-titulo').value;
        const dataAcontecimento = document.getElementById('museu-data').value;
        const desc = document.getElementById('museu-desc').value;
        const arquivoInput = document.getElementById('museu-arquivo');
        const arquivo = arquivoInput.files[0];

        // Feedback visual
        btn.innerText = idMuseuEditando ? "Atualizando..." : "Eternizando...";
        btn.disabled = true;

        try {
            let mediaUrl = null;
            
            // A. Upload de nova imagem (se o usuário escolheu uma)
            if (arquivo) {
                const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
                const nomeArquivo = `museu/${Date.now()}_${nomeLimpo}`; // Pasta museu/
                
                const { error: uploadError } = await supabase.storage.from('album-casal').upload(nomeArquivo, arquivo);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('album-casal').getPublicUrl(nomeArquivo);
                mediaUrl = publicUrl;
            }

            // B. Identificar usuário
            const { data: { user } } = await supabase.auth.getUser();
            const usuarioNome = (user.email.includes('enzo')) ? 'enzo' : 'brenda'; 

            // C. Montar objeto de dados
            const dadosParaSalvar = {
                titulo: titulo,
                data_acontecimento: dataAcontecimento,
                descricao: desc,
                usuario: usuarioNome
            };

            // Só atualiza a URL da mídia se o usuário enviou uma nova
            // (Se for edição e ele não mandou foto nova, mantém a antiga)
            if (mediaUrl) {
                dadosParaSalvar.url_midia = mediaUrl;
            }

            let erroDb = null;

            if (idMuseuEditando) {
                // --- MODO EDIÇÃO (UPDATE) ---
                const { error } = await supabase
                    .from('museu')
                    .update(dadosParaSalvar)
                    .eq('id', idMuseuEditando);
                erroDb = error;
            } else {
                // --- MODO CRIAÇÃO (INSERT) ---
                // Se for novo e não tiver mídia, salvamos null (ou a URL se tiver)
                if (!dadosParaSalvar.url_midia) dadosParaSalvar.url_midia = null;
                
                const { error } = await supabase
                    .from('museu')
                    .insert([dadosParaSalvar]);
                erroDb = error;
            }

            if (erroDb) throw erroDb;

            alert(idMuseuEditando ? "Relíquia atualizada!" : "Item adicionado ao Museu! 🏛️");
            
            // Reset total
            formMuseu.reset();
            formMuseu.style.display = 'none';
            btnAddMuseu.innerText = '+ Adicionar Relíquia';
            idMuseuEditando = null; 
            
            // Recarrega a timeline
            carregarMuseu();

        } catch (erro) {
            console.error(erro);
            alert("Erro: " + erro.message);
        } finally {
            btn.innerText = "Eternizar Momento";
            btn.disabled = false;
        }
    });
}

// --- FUNÇÕES DE EDIÇÃO E REMOÇÃO (DELETE) ---

// Prepara o formulário com os dados existentes
async function prepararEdicaoMuseu(id) {
    // 1. Busca os dados do item específico
    const { data, error } = await supabase
        .from('museu')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) return alert("Erro ao buscar item para editar.");

    // 2. Preenche os campos
    document.getElementById('museu-titulo').value = data.titulo;
    document.getElementById('museu-data').value = data.data_acontecimento;
    document.getElementById('museu-desc').value = data.descricao;
    
    // 3. Muda o estado para EDIÇÃO
    idMuseuEditando = id;
    formMuseu.style.display = 'block';
    
    // Ajusta textos dos botões
    btnAddMuseu.innerText = 'Cancelar Edição X';
    document.getElementById('btn-salvar-museu').innerText = 'Salvar Alterações';
    
    // Rola a tela até o formulário
    formMuseu.scrollIntoView({ behavior: 'smooth' });
}

// Apaga o item
async function apagarItemMuseu(id) {
    if (confirm("Tem certeza que quer remover essa memória do museu para sempre?")) {
        const { error } = await supabase.from('museu').delete().eq('id', id);
        
        if (error) {
            alert("Erro ao apagar: " + error.message);
        } else {
            alert("Memória removida.");
            carregarMuseu();
        }
    }
}

// --- MODAL DE DETALHES ---

function abrirModalMuseu(item) {
    const modal = document.getElementById('modal-museu');
    const imgArea = document.getElementById('modal-museu-img-area');
    const img = document.getElementById('modal-museu-img');
    const titulo = document.getElementById('modal-museu-titulo');
    const data = document.getElementById('modal-museu-data');
    const desc = document.getElementById('modal-museu-desc');
    const autor = document.getElementById('modal-museu-autor');
    
    // Botões de Ação dentro do Modal
    const btnEditar = document.getElementById('btn-modal-editar');
    const btnApagar = document.getElementById('btn-modal-apagar');

    // Preenche visual
    titulo.innerText = item.titulo;
    data.innerText = new Date(item.data_acontecimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    desc.innerText = item.descricao || "";
    autor.innerText = "Eternizado por: " + (item.usuario === 'enzo' ? 'Enzo' : 'Brenda');

    if (item.url_midia) {
        img.src = item.url_midia;
        imgArea.style.display = 'flex';
    } else {
        imgArea.style.display = 'none';
    }

    // --- CONFIGURA OS BOTÕES DO MODAL ---
    // Aqui usamos uma função anônima para passar o ID correto
    
    btnEditar.onclick = function() {
        fecharModalMuseu(); 
        prepararEdicaoMuseu(item.id); 
    };

    btnApagar.onclick = function() {
        // Confirmação antes de fechar o modal
        if (confirm("Tem certeza que deseja apagar esta memória?")) {
            fecharModalMuseu();
            apagarItemMuseu(item.id);
        }
    };

    modal.style.display = 'flex';
}

function fecharModalMuseu() {
    document.getElementById('modal-museu').style.display = 'none';
}