// --- CARREGAR GALERIA (Exibir as fotos) ---
async function carregarGaleria() {
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
        
        if (data.length === 0) {
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

// Função auxiliar simples para formatar a data (opcional, mas fica bonito)
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}


// --- INTERAÇÕES DO FORMULÁRIO (Botões e Upload) ---

// 1. Botão de "Adicionar Nova Foto" (Abre/Fecha o form)
const toggleBtn = document.getElementById('toggle-upload-form-btn');
const uploadForm = document.getElementById('upload-form');

if (toggleBtn && uploadForm) {
    toggleBtn.addEventListener('click', () => {
        const isVisible = uploadForm.style.display === 'block';
        uploadForm.style.display = isVisible ? 'none' : 'block';
        // Muda o texto do botão
        toggleBtn.textContent = isVisible ? 'Adicionar Nova Foto +' : 'Cancelar X';
    });
}

// 2. Enviar a Foto (Submit)
if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede a página de recarregar
        
        const fileInput = document.getElementById('upload-file');
        const arquivo = fileInput.files[0];
        const btnSalvar = document.getElementById('btn-salvar-foto');

        // Validação simples
        if (!arquivo) return alert("Selecione uma foto!");

        try {
            // Feedback visual no botão
            btnSalvar.textContent = "Enviando...";
            btnSalvar.disabled = true;

            // A. Preparar nome do arquivo (remove acentos e espaços)
            const nomeLimpo = arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
            const nomeArquivo = `galeria/${Date.now()}_${nomeLimpo}`; // Pasta galeria/

            // B. Upload da Imagem para o Storage
            const { data, error: uploadError } = await supabase.storage
                .from('album-casal')
                .upload(nomeArquivo, arquivo);
                
            if (uploadError) throw uploadError;

            // C. Pegar o Link Público
            const { data: { publicUrl } } = supabase.storage
                .from('album-casal')
                .getPublicUrl(nomeArquivo);

            // D. Salvar informações no Banco de Dados
            const { error: dbError } = await supabase.from('fotos').insert([{
                url_imagem: publicUrl,
                descricao: document.getElementById('upload-descricao').value,
                lugar: document.getElementById('upload-lugar').value,
                data_momento: document.getElementById('upload-data').value,
                periodo: 'indefinido' // Valor padrão
            }]);

            if (dbError) throw dbError;

            // Sucesso!
            alert('Foto salva no nosso cantinho! ❤️');
            
            // Limpa e esconde o form
            uploadForm.reset();
            uploadForm.style.display = 'none';
            toggleBtn.textContent = 'Adicionar Nova Foto +';
            
            // Recarrega a galeria para mostrar a foto nova
            carregarGaleria();

        } catch (erro) {
            console.error(erro);
            alert('Erro ao salvar foto: ' + erro.message);
        } finally {
            // Restaura o botão
            btnSalvar.textContent = "Salvar Foto";
            btnSalvar.disabled = false;
        }
    });
}   