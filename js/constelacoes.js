import { supabase } from './supabaseClient.js';

// --- 1. O CÉU (Background Interativo) ---
export function gerarCeuEstrelado() {
    const ceu = document.getElementById('ceu-fundo');
    if (!ceu || ceu.children.length > 0) return; 

    const frases = [
        "Seu sorriso ✨", "Nosso amor ❤️", "Paciência", "Carinho", 
        "Momentos únicos", "Te amo!", "Minha vida", "Sorte a minha", 
        "Conexão", "Luz", "Futuro", "Alegria", "Paz", "Destino"
    ];

    for (let i = 0; i < 80; i++) {
        const estrela = document.createElement('div');
        estrela.className = 'estrela-fundo';
        
        const tam = Math.random() * 3 + 1;
        estrela.style.width = `${tam}px`;
        estrela.style.height = `${tam}px`;
        estrela.style.top = `${Math.random() * 100}%`;
        estrela.style.left = `${Math.random() * 100}%`;
        
        estrela.style.animationDuration = `${Math.random() * 3 + 1}s`;
        estrela.style.animationDelay = `${Math.random() * 5}s`;

        estrela.onclick = (e) => {
            const frase = frases[Math.floor(Math.random() * frases.length)];
            mostrarMensagemEstrela(e.clientX, e.clientY, frase);
            
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

function mostrarMensagemEstrela(x, y, texto) {
    const msg = document.createElement('div');
    msg.className = 'star-message';
    msg.innerText = texto;
    msg.style.left = `${x}px`;
    msg.style.top = `${y - 30}px`; 
    document.body.appendChild(msg);
    setTimeout(() => { msg.remove(); }, 2500);
}


// --- 2. CARREGAR CONSTELAÇÕES (Os Itens do Casal) ---
export async function carregarConstelacoes() {
    const grid = document.getElementById('grid-constelacoes');
    if (!grid) return;
    
    if(grid.innerHTML.includes('item-constelacao')) return; 

    grid.innerHTML = '<p style="color:white; width:100%; text-align:center;">Olhando para o céu...</p>';

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
        
        const randomLeft = Math.random() * 80 + 5; 
        const randomTop = Math.random() * 70 + 5;
        
        div.style.left = `${randomLeft}%`;
        div.style.top = `${randomTop}%`;

        // Click para abrir Modal
        div.onclick = () => abrirModalConstelacao(item);
        
        grid.appendChild(div);
    });
}


// --- FUNÇÕES MODAL (Internas) ---

function abrirModalConstelacao(item) {
    const modal = document.getElementById('modal-constelacao');
    
    document.getElementById('modal-const-img').src = item.url_imagem;
    document.getElementById('modal-const-titulo').innerText = item.titulo;
    document.getElementById('modal-const-data').innerText = new Date(item.data_evento).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    document.getElementById('modal-const-desc').innerText = item.descricao || "Sem descrição";

    const btnApagar = document.getElementById('btn-apagar-const');
    
    // Clona para limpar evento anterior
    const novoBtnApagar = btnApagar.cloneNode(true);
    btnApagar.parentNode.replaceChild(novoBtnApagar, btnApagar);
    
    novoBtnApagar.onclick = async () => {
        if(confirm("Deseja apagar esta estrela para sempre?")) {
            const { error } = await supabase.from('constelacoes').delete().eq('id', item.id);
            
            if (error) {
                alert("Erro ao apagar: " + error.message);
            } else {
                fecharModalConstelacao();
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

// --- SETUP DE EVENTOS (Exportado) ---
export function setupConstelacoes() {
    const btnAddConst = document.getElementById('btn-add-constelacao');
    const formConst = document.getElementById('form-constelacao');
    const modal = document.getElementById('modal-constelacao');

    // 1. Botão Fechar Modal
    if (modal) {
        const btnFechar = modal.querySelector('button'); // O 'X'
        if (btnFechar) {
            const novoBtnFechar = btnFechar.cloneNode(true);
            btnFechar.parentNode.replaceChild(novoBtnFechar, btnFechar);
            novoBtnFechar.addEventListener('click', fecharModalConstelacao);
        }
    }

    // 2. Botão Adicionar/Cancelar
    if (btnAddConst && formConst) {
        const novoBtn = btnAddConst.cloneNode(true);
        btnAddConst.parentNode.replaceChild(novoBtn, btnAddConst);

        novoBtn.addEventListener('click', () => {
            const isVisible = formConst.style.display === 'block';
            formConst.style.display = isVisible ? 'none' : 'block';
            novoBtn.innerText = isVisible ? '+ Adicionar Mapa Estelar' : 'Cancelar X';
        });
    }

    // 3. Submit Form
    if (formConst) {
        const novoForm = formConst.cloneNode(true);
        formConst.parentNode.replaceChild(novoForm, formConst);

        novoForm.addEventListener('submit', async (e) => {
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
                const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
                const nomeArquivo = `constelacoes/${Date.now()}_${nomeLimpo}`;
                
                const { error: uploadError } = await supabase.storage.from('album-casal').upload(nomeArquivo, arquivo);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('album-casal').getPublicUrl(nomeArquivo);

                const { data: { user } } = await supabase.auth.getUser();
                const usuarioNome = (user.email.includes('enzo')) ? 'enzo' : 'brenda'; 

                const { error: dbError } = await supabase.from('constelacoes').insert([{
                    titulo: titulo,
                    data_evento: dataEvento,
                    descricao: desc,
                    url_imagem: publicUrl,
                    usuario: usuarioNome
                }]);

                if (dbError) throw dbError;

                alert("Constelação criada! ✨");
                
                novoForm.reset();
                novoForm.style.display = 'none';
                
                const btnAdd = document.getElementById('btn-add-constelacao');
                if(btnAdd) btnAdd.innerText = '+ Adicionar Mapa Estelar';
                
                // Recarrega
                const grid = document.getElementById('grid-constelacoes');
                grid.innerHTML = ''; 
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
}