// --- CARREGAR LEMBRETES (Mural) ---
async function carregarLembretes() {
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
        const corBarra = isEnzo ? '#007bff' : '#d81b60'; // Azul pro Enzo, Rosa pra Brenda
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
        // Estilo inline para garantir (mas idealmente estaria no CSS)
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
        
        // Efeito Hover simples via JS
        card.onmouseover = () => card.style.transform = "scale(1.05)";
        card.onmouseout = () => card.style.transform = "scale(1)";

        grid.appendChild(card);
    });
}

// --- LÓGICA DO FORMULÁRIO (Adicionar Novo) ---

const btnAddLembrete = document.getElementById('btn-add-lembrete');
const formLembrete = document.getElementById('form-lembrete');
const selectTipo = document.getElementById('lembrete-tipo');

// 1. Alternar visualização do Form
if (btnAddLembrete && formLembrete) {
    btnAddLembrete.addEventListener('click', () => {
        const isVisible = formLembrete.style.display === 'block';
        formLembrete.style.display = isVisible ? 'none' : 'block';
        btnAddLembrete.innerText = isVisible ? '+ Adicionar Novo' : 'Cancelar X';
    });
}

// 2. Mudança no Select (Mostra campo de link se necessário)
if (selectTipo) {
    selectTipo.addEventListener('change', (e) => {
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

// 3. Enviar Lembrete (Submit)
if (formLembrete) {
    formLembrete.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btn-salvar-lembrete');
        const tipo = selectTipo.value;
        const desc = document.getElementById('lembrete-desc').value;
        const urlLink = document.getElementById('lembrete-url').value;
        const arquivoInput = document.getElementById('lembrete-arquivo');
        const arquivo = arquivoInput.files[0];

        // Validações
        if (tipo === 'link' && !urlLink) return alert("Cole o link!");
        if ((tipo === 'foto' || tipo === 'video') && !arquivo) return alert("Selecione o arquivo!");

        btn.innerText = "Enviando...";
        btn.disabled = true;

        try {
            let conteudoUrl = null;
            
            // Upload do arquivo (se houver)
            if (arquivo) {
                // Nome limpo e único
                const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
                const nomeArquivo = `lembretes/${Date.now()}_${nomeLimpo}`; // Pasta específica
                
                const { error: uploadError } = await supabase.storage.from('album-casal').upload(nomeArquivo, arquivo);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('album-casal').getPublicUrl(nomeArquivo);
                conteudoUrl = publicUrl;
            }

            // Descobre quem é o usuário logado
            const { data: { user } } = await supabase.auth.getUser();
            // Lógica simples: se o email tem 'enzo', é o enzo. Senão é a brenda.
            const usuarioNome = (user.email.includes('enzo')) ? 'enzo' : 'brenda'; 

            // Salva no Banco
            const { error: dbError } = await supabase.from('lembretes').insert([{
                usuario: usuarioNome,
                tipo: tipo,
                conteudo_url: conteudoUrl,
                link_destino: (tipo === 'link' ? urlLink : null),
                descricao: desc
            }]);

            if (dbError) throw dbError;

            alert("Postado com sucesso!");
            
            // Reset do form
            formLembrete.reset();
            formLembrete.style.display = 'none';
            btnAddLembrete.innerText = '+ Adicionar Novo';
            
            // Recarrega o grid
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


// --- MODAL DE VISUALIZAÇÃO ---

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
    
    // Limpa o conteúdo para parar vídeos tocando no fundo
    const areaVisual = document.getElementById('modal-conteudo-visual');
    if (areaVisual) areaVisual.innerHTML = '';
}