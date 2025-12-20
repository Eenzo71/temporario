// --- 1. O CÉU (Background Interativo) ---

function gerarCeuEstrelado() {
    const ceu = document.getElementById('ceu-fundo');
    
    // Proteção: Se não estiver na página ou se o céu já tiver estrelas, não faz nada
    if (!ceu || ceu.children.length > 0) return; 

    // Frases aleatórias para aparecer ao clicar nas estrelas de fundo
    const frases = [
        "Seu sorriso ✨", "Nosso amor ❤️", "Paciência", "Carinho", 
        "Momentos únicos", "Te amo!", "Minha vida", "Sorte a minha", 
        "Conexão", "Luz", "Futuro", "Alegria", "Paz", "Destino"
    ];

    // Criar 80 estrelas aleatórias
    for (let i = 0; i < 80; i++) {
        const estrela = document.createElement('div');
        estrela.className = 'estrela-fundo';
        
        // Tamanho e Posição Aleatória (0% a 100% da tela)
        const tam = Math.random() * 3 + 1; // Entre 1px e 4px
        estrela.style.width = `${tam}px`;
        estrela.style.height = `${tam}px`;
        estrela.style.top = `${Math.random() * 100}%`;
        estrela.style.left = `${Math.random() * 100}%`;
        
        // Animação de piscar com tempos diferentes para parecer natural
        estrela.style.animationDuration = `${Math.random() * 3 + 1}s`;
        estrela.style.animationDelay = `${Math.random() * 5}s`;

        // INTERAÇÃO: Clique na estrela
        estrela.onclick = (e) => {
            const frase = frases[Math.floor(Math.random() * frases.length)];
            mostrarMensagemEstrela(e.clientX, e.clientY, frase);
            
            // Efeito visual de brilho instantâneo
            estrela.style.transform = "scale(2)";
            estrela.style.boxShadow = "0 0 15px white";
            setTimeout(() => {
                estrela.style.transform = "scale(1)";
                estrela.style.boxShadow = "none";
            }, 500);
        };

        ceu.appendChild(estrela);
    }
}

// Mostra a mensagem flutuante (Toast) onde clicou
function mostrarMensagemEstrela(x, y, texto) {
    const msg = document.createElement('div');
    msg.className = 'star-message';
    msg.innerText = texto;
    
    // Ajuste de posição para o dedo/mouse não tampar o texto
    msg.style.left = `${x}px`;
    msg.style.top = `${y - 30}px`; 
    
    document.body.appendChild(msg);

    // Remove do HTML depois que a animação termina (2.5s)
    setTimeout(() => { msg.remove(); }, 2500);
}


// --- 2. CARREGAR CONSTELAÇÕES (Os Itens do Casal) ---

async function carregarConstelacoes() {
    const grid = document.getElementById('grid-constelacoes');
    if (!grid) return;
    
    // Se já tem conteúdo (planetas), não recarrega para eles não mudarem de lugar
    if(grid.innerHTML.includes('item-constelacao')) return; 

    grid.innerHTML = '<p style="color:white; width:100%; text-align:center;">Olhando para o céu...</p>';

    // Busca no banco
    const { data, error } = await supabase
        .from('constelacoes')
        .select('*')
        .order('data_evento', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }
    
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<p style="color:#aaa; width:100%; text-align:center;">O céu ainda está limpo. Adicione um mapa estelar!</p>';
        return;
    }

    data.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'item-constelacao';
        div.innerHTML = `
            <img src="${item.url_imagem}" alt="${item.titulo}">
            <span>${item.titulo}</span>
        `;
        
        // --- ESPALHAMENTO ALEATÓRIO (A Lógica dos Planetas) ---
        // Posição aleatória dentro da área disponível
        // Left: 5% a 85% (pra não cortar na borda direita)
        // Top: 5% a 75% (pra não cortar embaixo)
        const randomLeft = Math.random() * 80 + 5; 
        const randomTop = Math.random() * 70 + 5;
        
        div.style.left = `${randomLeft}%`;
        div.style.top = `${randomTop}%`;

        // Click para abrir Modal
        div.onclick = () => abrirModalConstelacao(item);
        
        grid.appendChild(div);
    });
}


// --- 3. FORMULÁRIO (Adicionar Novo Mapa) ---

const btnAddConst = document.getElementById('btn-add-constelacao');
const formConst = document.getElementById('form-constelacao');

// Alternar Visibilidade do Form
if (btnAddConst && formConst) {
    btnAddConst.addEventListener('click', () => {
        const isVisible = formConst.style.display === 'block';
        formConst.style.display = isVisible ? 'none' : 'block';
        btnAddConst.innerText = isVisible ? '+ Adicionar Mapa Estelar' : 'Cancelar X';
    });
}

// Salvar Constelação (Upload + Insert)
if (formConst) {
    formConst.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btn-salvar-const');
        const titulo = document.getElementById('const-titulo').value;
        const dataEvento = document.getElementById('const-data').value;
        const desc = document.getElementById('const-desc').value;
        const arquivoInput = document.getElementById('const-arquivo');
        const arquivo = arquivoInput.files[0];

        if (!arquivo) return alert("Selecione a imagem do mapa!");

        btn.innerText = "Enviando para o espaço...";
        btn.disabled = true;

        try {
            // A. Upload da Imagem
            const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
            const nomeArquivo = `constelacoes/${Date.now()}_${nomeLimpo}`; // Pasta constelacoes/
            
            const { error: uploadError } = await supabase.storage.from('album-casal').upload(nomeArquivo, arquivo);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('album-casal').getPublicUrl(nomeArquivo);

            // B. Identificar usuário
            const { data: { user } } = await supabase.auth.getUser();
            const usuarioNome = (user.email.includes('enzo')) ? 'enzo' : 'brenda'; 

            // C. Salvar no Banco
            const { error: dbError } = await supabase.from('constelacoes').insert([{
                titulo: titulo,
                data_evento: dataEvento,
                descricao: desc,
                url_imagem: publicUrl,
                usuario: usuarioNome
            }]);

            if (dbError) throw dbError;

            alert("Constelação criada! ✨");
            
            // Reset
            formConst.reset();
            formConst.style.display = 'none';
            btnAddConst.innerText = '+ Adicionar Mapa Estelar';
            
            // Recarrega (vai redistribuir as posições, dando um efeito novo)
            const grid = document.getElementById('grid-constelacoes');
            grid.innerHTML = ''; // Força limpar para recarregar
            carregarConstelacoes();

        } catch (erro) {
            console.error(erro);
            alert("Erro: " + erro.message);
        } finally {
            btn.innerText = "Criar Constelação";
            btn.disabled = false;
        }
    });
}


// --- 4. MODAL E DETALHES ---

function abrirModalConstelacao(item) {
    const modal = document.getElementById('modal-constelacao');
    
    // Preenche os dados
    document.getElementById('modal-const-img').src = item.url_imagem;
    document.getElementById('modal-const-titulo').innerText = item.titulo;
    document.getElementById('modal-const-data').innerText = new Date(item.data_evento).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    document.getElementById('modal-const-desc').innerText = item.descricao || "Sem descrição";

    // Configura o Botão de Apagar
    const btnApagar = document.getElementById('btn-apagar-const');
    
    // Sobrescreve o onclick para usar o ID deste item específico
    btnApagar.onclick = async () => {
        if(confirm("Deseja apagar esta estrela para sempre?")) {
            const { error } = await supabase.from('constelacoes').delete().eq('id', item.id);
            
            if (error) {
                alert("Erro ao apagar: " + error.message);
            } else {
                fecharModalConstelacao();
                // Força recarregar para sumir com o item da tela
                const grid = document.getElementById('grid-constelacoes');
                grid.innerHTML = ''; 
                carregarConstelacoes();
            }
        }
    };

    modal.style.display = 'flex';
}

function fecharModalConstelacao() {
    const modal = document.getElementById('modal-constelacao');
    if(modal) modal.style.display = 'none';
}