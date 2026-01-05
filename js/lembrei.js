import { supabase } from './supabaseClient.js';

// --- CARREGAR LEMBRETES (Mural) ---
export async function carregarLembretes() {
    const grid = document.getElementById('grid-lembretes');
    
    // Proteção se o elemento não existir
    if (!grid) return;

    grid.innerHTML = '<p style="text-align:center; color:white; width:100%;">Buscando lembranças...</p>';

    // Busca no Supabase ordenado por data
    const { data, error } = await supabase
        .from('lembretes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !data) {
        grid.innerHTML = '<p style="color:white; text-align:center;">Erro ao carregar.</p>';
        console.error(error);
        return;
    }

    grid.innerHTML = ''; // Limpa carregamento

    if (data.length === 0) {
        grid.innerHTML = '<p style="color:white; text-align:center;">Nada aqui ainda.</p>';
        return;
    }

    // Cria os cards
    data.forEach(item => {
        // Define cor e nome baseado no usuario salvo
        const isEnzo = (item.usuario === 'enzo');
        const corBarra = isEnzo ? '#007bff' : '#d81b60';
        const nomeAutor = isEnzo ? 'Enzo' : 'Brenda';
        
        // Define o que mostrar no card (Miniatura)
        let midiaHTML = '';
        if (item.tipo === 'video') {
            midiaHTML = `<video src="${item.conteudo_url}" style="width:100%; height:150px; object-fit:cover;"></video>`;
        } else if (item.conteudo_url) { // Foto ou Capa de Link
            midiaHTML = `<img src="${item.conteudo_url}" style="width:100%; height:150px; object-fit:cover;">`;
        } else {
            // Se for link sem imagem de capa
            midiaHTML = `<div style="width:100%; height:150px; background:#eee; display:flex; align-items:center; justify-content:center; font-size:2rem;">🔗</div>`;
        }

        const card = document.createElement('div');
        card.style.cssText = "background: white; border-radius: 10px; overflow: hidden; cursor: pointer; transition: transform 0.2s; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.1);";
        
        card.innerHTML = `
            ${midiaHTML}
            <div style="background: ${corBarra}; color: white; padding: 5px 10px; font-size: 0.8rem; text-align: center; font-weight: bold;">
                Postado por ${nomeAutor}
            </div>
            <div style="padding: 10px; color: #333; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${item.descricao || 'Sem descrição'}
            </div>
        `;
        
        // Clique abre o modal
        card.onclick = () => abrirModalLembrete(item);
        
        // Efeito Hover
        card.onmouseover = () => card.style.transform = "scale(1.05)";
        card.onmouseout = () => card.style.transform = "scale(1)";

        grid.appendChild(card);
    });
}

// --- FUNÇÕES DE MODAL (Internas ao módulo) ---

function abrirModalLembrete(item) {
    const modal = document.getElementById('modal-lembrete');
    const areaVisual = document.getElementById('modal-conteudo-visual');
    const desc = document.getElementById('modal-desc');
    const btnLink = document.getElementById('modal-btn-link');
    const autor = document.getElementById('modal-autor');

    if (!modal) return;

    modal.style.display = 'flex';
    
    // Configura textos
    desc.innerHTML = item.descricao || "Sem descrição.";
    autor.innerText = (item.usuario === 'enzo' ? 'Enzo' : 'Brenda');
    autor.style.background = (item.usuario === 'enzo' ? '#007bff' : '#d81b60');

    // Configura área visual (Foto/Vídeo)
    areaVisual.innerHTML = '';
    
    if (item.tipo === 'video') {
        areaVisual.innerHTML = `<video src="${item.conteudo_url}" controls autoplay style="max-width:100%; max-height:60vh;"></video>`;
        btnLink.style.display = 'none';
    } else if (item.tipo === 'foto') {
        areaVisual.innerHTML = `<img src="${item.conteudo_url}" style="max-width:100%; max-height:60vh;">`;
        btnLink.style.display = 'none';
    } else {
        // Link
        if (item.conteudo_url) {
            areaVisual.innerHTML = `<img src="${item.conteudo_url}" style="max-width:100%; max-height:60vh;">`;
        } else {
             areaVisual.innerHTML = `<div style="padding:50px; color:white; font-size:3rem;">🔗 Link Externo</div>`;
        }
        btnLink.style.display = 'block';
        btnLink.href = item.link_destino;
        desc.innerHTML = `<b>🔗 Link para visitar:</b> <br> ${item.descricao || ''}`;
    }
}

function fecharModalLembrete() {
    const modal = document.getElementById('modal-lembrete');
    if (modal) modal.style.display = 'none';
    
    const areaVisual = document.getElementById('modal-conteudo-visual');
    if (areaVisual) areaVisual.innerHTML = '';
}

// --- SETUP DE EVENTOS (Exportado para o app.js) ---
export function setupLembrei() {
    const btnAddLembrete = document.getElementById('btn-add-lembrete');
    const formLembrete = document.getElementById('form-lembrete');
    const selectTipo = document.getElementById('lembrete-tipo');
    
    // 1. Botão Fechar Modal (Busca pelo botão dentro do modal)
    // Assumindo que o botão de fechar é o primeiro button dentro do modal ou tem uma classe específica
    const modal = document.getElementById('modal-lembrete');
    if (modal) {
        const btnFechar = modal.querySelector('button'); // O 'X'
        if (btnFechar) {
            // Remove listener antigo e adiciona novo
            const novoBtnFechar = btnFechar.cloneNode(true);
            btnFechar.parentNode.replaceChild(novoBtnFechar, btnFechar);
            novoBtnFechar.addEventListener('click', fecharModalLembrete);
        }
    }

    // 2. Botão Adicionar (Toggle Form)
    if (btnAddLembrete && formLembrete) {
        const novoBtn = btnAddLembrete.cloneNode(true);
        btnAddLembrete.parentNode.replaceChild(novoBtn, btnAddLembrete);
        
        novoBtn.addEventListener('click', () => {
            const isVisible = formLembrete.style.display === 'block';
            formLembrete.style.display = isVisible ? 'none' : 'block';
            novoBtn.innerText = isVisible ? '+ Adicionar Novo' : 'Cancelar X';
        });
    }

    // 3. Select Tipo (Mudança dinâmica)
    if (selectTipo) {
        // O select não costuma ter cloneNode necessário a menos que recarregue a página sem refresh muitas vezes
        // Mas por segurança, podemos só adicionar o evento se garantir que não duplica.
        // Vamos usar a técnica de replace também.
        const novoSelect = selectTipo.cloneNode(true);
        selectTipo.parentNode.replaceChild(novoSelect, selectTipo);
        
        novoSelect.addEventListener('change', (e) => {
            const tipo = e.target.value;
            const campoLink = document.getElementById('campo-link');
            const labelArquivo = document.getElementById('label-arquivo');
            const msgCapa = document.getElementById('msg-capa-link');
            
            if (tipo === 'link') {
                campoLink.style.display = 'block';
                labelArquivo.innerText = "Capa do Link (Opcional):";
                msgCapa.style.display = 'block';
            } else {
                campoLink.style.display = 'none';
                labelArquivo.innerText = "Escolha o arquivo:";
                msgCapa.style.display = 'none';
            }
        });
    }

    // 4. Form Submit
    if (formLembrete) {
        const novoForm = formLembrete.cloneNode(true);
        formLembrete.parentNode.replaceChild(novoForm, formLembrete);

        novoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('btn-salvar-lembrete');
            // Re-busca o select atualizado do DOM (pois foi clonado)
            const tipo = document.getElementById('lembrete-tipo').value;
            const desc = document.getElementById('lembrete-desc').value;
            const urlLink = document.getElementById('lembrete-url').value;
            const arquivoInput = document.getElementById('lembrete-arquivo');
            const arquivo = arquivoInput.files[0];

            if (tipo === 'link' && !urlLink) return alert("Cole o link!");
            if ((tipo === 'foto' || tipo === 'video') && !arquivo) return alert("Selecione o arquivo!");

            btn.innerText = "Enviando...";
            btn.disabled = true;

            try {
                let conteudoUrl = null;
                
                if (arquivo) {
                    const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
                    const nomeArquivo = `lembretes/${Date.now()}_${nomeLimpo}`;
                    
                    const { error: uploadError } = await supabase.storage.from('album-casal').upload(nomeArquivo, arquivo);
                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage.from('album-casal').getPublicUrl(nomeArquivo);
                    conteudoUrl = publicUrl;
                }

                const { data: { user } } = await supabase.auth.getUser();
                const usuarioNome = (user.email.includes('enzo')) ? 'enzo' : 'brenda'; 

                const { error: dbError } = await supabase.from('lembretes').insert([{
                    usuario: usuarioNome,
                    tipo: tipo,
                    conteudo_url: conteudoUrl,
                    link_destino: (tipo === 'link' ? urlLink : null),
                    descricao: desc
                }]);

                if (dbError) throw dbError;

                alert("Postado com sucesso!");
                novoForm.reset();
                novoForm.style.display = 'none';
                
                // Reseta botão toggle
                const btnToggle = document.getElementById('btn-add-lembrete');
                if(btnToggle) btnToggle.innerText = '+ Adicionar Novo';
                
                carregarLembretes();

            } catch (erro) {
                console.error(erro);
                alert("Erro: " + erro.message);
            } finally {
                btn.innerText = "Postar";
                btn.disabled = false;
            }
        });
    }
}