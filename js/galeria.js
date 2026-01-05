import { supabase } from './supabaseClient.js';

// --- CARREGAR GALERIA (Exibir as fotos) ---
export async function carregarGaleria() {
    const grid = document.getElementById('photo-grid');
    
    // Proteção: Se não achar o grid (estiver em outra pág), para aqui.
    if(!grid) return;

    // Feedback de carregamento
    grid.innerHTML = '<p style="text-align:center; color: white;">Revelando memórias...</p>';

    // Busca as fotos no banco, da mais recente para a mais antiga
    const { data, error } = await supabase
        .from('fotos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        grid.innerHTML = '<p style="text-align:center;">Erro ao carregar fotos.</p>';
        console.error(error);
    } else {
        grid.innerHTML = ''; // Limpa o texto de carregamento
        
        if (!data || data.length === 0) {
            grid.innerHTML = '<p style="text-align:center;">Nenhuma foto ainda. Adicione a primeira! ❤️</p>';
            return;
        }
        
        // Cria os cards das fotos
        data.forEach(foto => {
            const div = document.createElement('div');
            div.className = 'photo-item';
            div.innerHTML = `
                <img src="${foto.url_imagem}" alt="${foto.descricao}" loading="lazy">
                <div class="photo-info">
                    <p class="photo-desc">${foto.descricao}</p>
                    <p class="photo-meta">${foto.lugar} - ${formatarData(foto.data_momento)}</p>
                </div>
            `;
            grid.appendChild(div);
        });
    }
}

// Função auxiliar simples para formatar a data
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// --- CONFIGURAÇÃO DE EVENTOS (Botões e Formulário) ---
// Essa função será chamada pelo router.js sempre que entrar na página 'galeria'
export function setupGaleria() {
    const toggleBtn = document.getElementById('toggle-upload-form-btn');
    const uploadForm = document.getElementById('upload-form');

    if (toggleBtn && uploadForm) {
        const novoBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(novoBtn, toggleBtn);

        novoBtn.addEventListener('click', () => {
            const isVisible = uploadForm.style.display === 'block';
            uploadForm.style.display = isVisible ? 'none' : 'block';
            novoBtn.textContent = isVisible ? 'Adicionar Nova Foto +' : 'Cancelar X';
        });
    }

    if (uploadForm) {
        const novoForm = uploadForm.cloneNode(true);
        uploadForm.parentNode.replaceChild(novoForm, uploadForm);

        novoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('upload-file');
            const arquivo = fileInput.files[0];
            const btnSalvar = document.getElementById('btn-salvar-foto');
            
            if (!arquivo) return alert("Selecione uma foto!");

            try {
                const textoOriginal = btnSalvar.textContent;
                btnSalvar.textContent = "Enviando...";
                btnSalvar.disabled = true;

                const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
                const nomeArquivo = `galeria/${Date.now()}_${nomeLimpo}`;

                const { data, error: uploadError } = await supabase.storage
                    .from('album-casal')
                    .upload(nomeArquivo, arquivo);
                    
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('album-casal')
                    .getPublicUrl(nomeArquivo);

                const { error: dbError } = await supabase.from('fotos').insert([{
                    url_imagem: publicUrl,
                    descricao: document.getElementById('upload-descricao').value,
                    lugar: document.getElementById('upload-lugar').value,
                    data_momento: document.getElementById('upload-data').value,
                    periodo: 'indefinido'
                }]);

                if (dbError) throw dbError;

                alert('Foto salva no nosso cantinho! ❤️');
                
                novoForm.reset();
                novoForm.style.display = 'none';
                
                const btnToggleAtual = document.getElementById('toggle-upload-form-btn');
                if(btnToggleAtual) btnToggleAtual.textContent = 'Adicionar Nova Foto +';
                
                carregarGaleria();

            } catch (erro) {
                console.error(erro);
                alert('Erro ao salvar foto: ' + erro.message);
            } finally {
                const btnSalvarAtual = document.getElementById('btn-salvar-foto');
                if(btnSalvarAtual) {
                    btnSalvarAtual.textContent = "Salvar Foto";
                    btnSalvarAtual.disabled = false;
                }
            }
        });
    }
}