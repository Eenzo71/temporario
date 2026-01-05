import { supabase } from './supabaseClient.js';

// --- VARIÁVEIS GLOBAIS DO MUSEU (Internas ao módulo) ---
let idMuseuEditando = null; 

// --- CARREGAR A LINHA DO TEMPO (READ) ---
export async function carregarMuseu() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:#888;">Polindo as relíquias...</p>';

    const { data, error } = await supabase
        .from('museu')
        .select('*')
        .order('data_acontecimento', { ascending: true });

    if (error || !data) {
        container.innerHTML = '<p style="text-align:center;">Erro ao carregar o museu.</p>';
        console.error(error);
        return;
    }
    
    container.innerHTML = ''; 

    if (data.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">O museu está vazio. Comece a sua história! 🏛️</p>';
        return;
    }

    data.forEach((item, index) => {
        const lado = (index % 2 === 0) ? 'left' : 'right';
        const dataFormatada = new Date(item.data_acontecimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        let imgHtml = '';
        if (item.url_midia) {
            imgHtml = `<img src="${item.url_midia}" class="museu-img-preview" alt="Relíquia" loading="lazy">`;
        }

        const descPreview = item.descricao || "Sem descrição.";

        const div = document.createElement('div');
        div.className = `timeline-item ${lado}`;

        // Cria o elemento content sem onclick no HTML string
        div.innerHTML = `
            <div class="content">
                <span class="date">${dataFormatada}</span>
                <h2>${item.titulo}</h2>
                <div class="museu-desc-preview">${descPreview}</div>
                ${imgHtml}
                <div style="margin-top: 10px; color: #d81b60; font-size: 0.8rem; font-weight: bold; text-align: center;">
                    Ver memória completa ✨
                </div>
            </div>
        `;
        
        // Adiciona o evento de clique via JS
        const contentDiv = div.querySelector('.content');
        contentDiv.addEventListener('click', () => abrirModalMuseu(item));

        container.appendChild(div);
    });
}

// --- FUNÇÕES DE EDIÇÃO E REMOÇÃO (Internas) ---

async function prepararEdicaoMuseu(id) {
    const { data, error } = await supabase.from('museu').select('*').eq('id', id).single();
    
    if (error) return alert("Erro ao buscar item para editar.");

    document.getElementById('museu-titulo').value = data.titulo;
    document.getElementById('museu-data').value = data.data_acontecimento;
    document.getElementById('museu-desc').value = data.descricao;
    
    idMuseuEditando = id;
    const formMuseu = document.getElementById('form-museu');
    const btnAddMuseu = document.getElementById('btn-add-museu');

    formMuseu.style.display = 'block';
    if(btnAddMuseu) btnAddMuseu.innerText = 'Cancelar Edição X';
    document.getElementById('btn-salvar-museu').innerText = 'Salvar Alterações';
    
    formMuseu.scrollIntoView({ behavior: 'smooth' });
}

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

// --- MODAL ---

function abrirModalMuseu(item) {
    const modal = document.getElementById('modal-museu');
    const imgArea = document.getElementById('modal-museu-img-area');
    const img = document.getElementById('modal-museu-img');
    const titulo = document.getElementById('modal-museu-titulo');
    const data = document.getElementById('modal-museu-data');
    const desc = document.getElementById('modal-museu-desc');
    const autor = document.getElementById('modal-museu-autor');
    
    const btnEditar = document.getElementById('btn-modal-editar');
    const btnApagar = document.getElementById('btn-modal-apagar');

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

    // Como o modal é único e reutilizado, precisamos limpar listeners antigos dos botões de ação
    // A melhor forma aqui é clonar os botões de ação para limpar eventos anteriores
    const novoBtnEditar = btnEditar.cloneNode(true);
    btnEditar.parentNode.replaceChild(novoBtnEditar, btnEditar);
    
    const novoBtnApagar = btnApagar.cloneNode(true);
    btnApagar.parentNode.replaceChild(novoBtnApagar, btnApagar);

    novoBtnEditar.addEventListener('click', () => {
        fecharModalMuseu(); 
        prepararEdicaoMuseu(item.id); 
    });

    novoBtnApagar.addEventListener('click', () => {
        if (confirm("Tem certeza que deseja apagar esta memória?")) {
            fecharModalMuseu();
            apagarItemMuseu(item.id);
        }
    });

    modal.style.display = 'flex';
}

function fecharModalMuseu() {
    document.getElementById('modal-museu').style.display = 'none';
}

// --- SETUP DE EVENTOS (Exportado) ---
export function setupMuseu() {
    const btnAddMuseu = document.getElementById('btn-add-museu');
    const formMuseu = document.getElementById('form-museu');
    const modal = document.getElementById('modal-museu');

    // 1. Botão Fechar Modal
    if (modal) {
        const btnFechar = modal.querySelector('button'); // O 'X' absoluto
        if (btnFechar) {
            const novoBtnFechar = btnFechar.cloneNode(true);
            btnFechar.parentNode.replaceChild(novoBtnFechar, btnFechar);
            novoBtnFechar.addEventListener('click', fecharModalMuseu);
        }
    }

    // 2. Botão Adicionar/Cancelar
    if (btnAddMuseu) {
        const novoBtn = btnAddMuseu.cloneNode(true);
        btnAddMuseu.parentNode.replaceChild(novoBtn, btnAddMuseu);

        novoBtn.addEventListener('click', () => {
            idMuseuEditando = null;
            formMuseu.reset();
            document.getElementById('btn-salvar-museu').innerText = 'Eternizar Momento';
            
            const isVisible = formMuseu.style.display === 'block';
            formMuseu.style.display = isVisible ? 'none' : 'block';
            novoBtn.innerText = isVisible ? '+ Adicionar Relíquia' : 'Cancelar X';
        });
    }

    // 3. Submit do Formulário
    if (formMuseu) {
        const novoForm = formMuseu.cloneNode(true);
        formMuseu.parentNode.replaceChild(novoForm, formMuseu);

        novoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('btn-salvar-museu');
            const titulo = document.getElementById('museu-titulo').value;
            const dataAcontecimento = document.getElementById('museu-data').value;
            const desc = document.getElementById('museu-desc').value;
            const arquivoInput = document.getElementById('museu-arquivo');
            const arquivo = arquivoInput.files[0];

            btn.innerText = idMuseuEditando ? "Atualizando..." : "Eternizando...";
            btn.disabled = true;

            try {
                let mediaUrl = null;
                
                if (arquivo) {
                    const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
                    const nomeArquivo = `museu/${Date.now()}_${nomeLimpo}`;
                    
                    const { error: uploadError } = await supabase.storage.from('album-casal').upload(nomeArquivo, arquivo);
                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage.from('album-casal').getPublicUrl(nomeArquivo);
                    mediaUrl = publicUrl;
                }

                const { data: { user } } = await supabase.auth.getUser();
                const usuarioNome = (user.email.includes('enzo')) ? 'enzo' : 'brenda'; 

                const dadosParaSalvar = {
                    titulo: titulo,
                    data_acontecimento: dataAcontecimento,
                    descricao: desc,
                    usuario: usuarioNome
                };

                if (mediaUrl) dadosParaSalvar.url_midia = mediaUrl;

                let erroDb = null;

                if (idMuseuEditando) {
                    const { error } = await supabase.from('museu').update(dadosParaSalvar).eq('id', idMuseuEditando);
                    erroDb = error;
                } else {
                    if (!dadosParaSalvar.url_midia) dadosParaSalvar.url_midia = null;
                    const { error } = await supabase.from('museu').insert([dadosParaSalvar]);
                    erroDb = error;
                }

                if (erroDb) throw erroDb;

                alert(idMuseuEditando ? "Relíquia atualizada!" : "Item adicionado ao Museu! 🏛️");
                
                novoForm.reset();
                novoForm.style.display = 'none';
                
                // Reseta botão de adicionar
                const btnAdd = document.getElementById('btn-add-museu');
                if(btnAdd) btnAdd.innerText = '+ Adicionar Relíquia';
                
                idMuseuEditando = null; 
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
}