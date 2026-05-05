import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/ui/MobileHeader';
import { ArrowLeft, Save, User, Activity, Coffee, Check, AlertCircle } from 'lucide-react';

const PatientForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pessoal');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Aba 1 - Pessoal
    nome: '',
    data_nascimento: '',
    sexo: '',
    whatsapp: '',
    email: '',
    // Aba 2 - Clínico
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    patologias_extra: '',
    restricoes_alimentares: [],
    restricoes_extra: '',
    alergias: [],
    alergias_extra: '',
    medicamentos: '',
    suplementos: '',
    // Aba 3 - Hábitos
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  const [age, setAge] = useState(null);
  const [imc, setImc] = useState(null);

  // Options for multi-select and radio
  const objetivoOptions = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
  const atividadeOptions = ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'];
  const patologiaOptions = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
  const restricaoOptions = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
  const alergiaOptions = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

  // Calculate Age
  useEffect(() => {
    if (formData.data_nascimento) {
      const birthDate = new Date(formData.data_nascimento);
      const today = new Date();
      let ageCalculated = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        ageCalculated--;
      }
      setAge(ageCalculated);
    } else {
      setAge(null);
    }
  }, [formData.data_nascimento]);

  // Calculate IMC
  useEffect(() => {
    if (formData.peso_inicial && formData.altura) {
      const weight = parseFloat(formData.peso_inicial);
      const height = parseFloat(formData.altura) / 100; // Convert cm to m
      if (height > 0) {
        const imcCalculated = weight / (height * height);
        setImc(imcCalculated.toFixed(2));
      }
    } else {
      setImc(null);
    }
  }, [formData.peso_inicial, formData.altura]);

  const maskPhone = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{2})(\d)/, "($1) $2");
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    return value.slice(0, 15);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'whatsapp') {
      finalValue = maskPhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (value === 'Nenhum') {
        return { ...prev, [field]: ['Nenhum'] };
      }
      
      const newSelection = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current.filter(item => item !== 'Nenhum'), value];
      
      return { ...prev, [field]: newSelection };
    });
  };

  const formatTime = (value) => {
    if (!value) return '';
    // Remove non-numeric
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 0) return '';
    
    let hours = '';
    let minutes = '00';
    
    if (cleanValue.length <= 2) {
      hours = cleanValue.padStart(2, '0');
    } else {
      hours = cleanValue.slice(0, 2).padStart(2, '0');
      minutes = cleanValue.slice(2, 4).padEnd(2, '0');
    }
    
    // Validate range
    if (parseInt(hours) > 23) hours = '23';
    if (parseInt(minutes) > 59) minutes = '59';
    
    return `${hours}:${minutes}`;
  };

  const handleTimeBlur = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: formatTime(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome) {
      setError('O nome completo é obrigatório.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Prepare data for insertion
      // Combine patologias, restricoes, alergias with extra text if needed
      const finalData = {
        ...formData,
        nutricionista_id: user.id,
        peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        refeicoes_por_dia: formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia) : null,
        litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
        // We'll store the extra fields as part of the arrays or in separate columns if they exist
        // Based on previous table check, we have specific columns or can merge into arrays
        patologias: formData.patologias_extra 
          ? [...formData.patologias, `Outros: ${formData.patologias_extra}`]
          : formData.patologias,
        restricoes_alimentares: formData.restricoes_extra
          ? [...formData.restricoes_alimentares, `Outros: ${formData.restricoes_extra}`]
          : formData.restricoes_alimentares,
        alergias: formData.alergias_extra
          ? [...formData.alergias, `Outros: ${formData.alergias_extra}`]
          : formData.alergias
      };

      // Remove extra fields that are not in the database
      delete finalData.patologias_extra;
      delete finalData.restricoes_extra;
      delete finalData.alergias_extra;

      const { data, error: insertError } = await supabase
        .from('pacientes')
        .insert([finalData])
        .select();

      if (insertError) throw insertError;

      setSuccess('Paciente cadastrado com sucesso!');
      setTimeout(() => {
        navigate(`/pacientes/${data[0].id}`);
      }, 1500);

    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      setError('Ocorreu um erro ao salvar o paciente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <MobileHeader isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <Link to="/pacientes" className="nav-item" style={{ width: 'fit-content', marginBottom: '1rem', padding: '0.5rem 0' }}>
            <ArrowLeft size={20} />
            Voltar para listagem
          </Link>
          <h1 style={{ color: 'var(--gray-800)', fontSize: '1.875rem', fontWeight: '700' }}>Novo Paciente</h1>
          <p style={{ color: 'var(--gray-600)' }}>Preencha os dados abaixo para cadastrar um novo paciente.</p>
        </header>

        {error && <div className="alert alert-error"><AlertCircle size={20} /> {error}</div>}
        {success && <div className="alert" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary)' }}><Check size={20} /> {success}</div>}

        <div className="auth-card" style={{ maxWidth: 'none', padding: '0' }}>
          {/* Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)' }}>
            <button 
              className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setActiveTab('pessoal')}
            >
              <User size={18} /> Pessoal
            </button>
            <button 
              className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinico')}
            >
              <Activity size={18} /> Clínico
            </button>
            <button 
              className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setActiveTab('habitos')}
            >
              <Coffee size={18} /> Hábitos
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
            {/* Aba 1: Pessoal */}
            {activeTab === 'pessoal' && (
              <div className="fade-in">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input 
                      type="text" 
                      name="nome" 
                      className="form-input" 
                      value={formData.nome} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Nascimento {age !== null && `(${age} anos)`}</label>
                    <input 
                      type="date" 
                      name="data_nascimento" 
                      className="form-input" 
                      value={formData.data_nascimento} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <select name="sexo" className="form-input" value={formData.sexo} onChange={handleInputChange}>
                      <option value="">Selecione...</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-input" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp *</label>
                    <input 
                      type="tel" 
                      name="whatsapp" 
                      className="form-input" 
                      value={formData.whatsapp} 
                      onChange={handleInputChange} 
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setActiveTab('clinico')}>
                    Próximo: Clínico
                  </button>
                </div>
              </div>
            )}

            {/* Aba 2: Clínico */}
            {activeTab === 'clinico' && (
              <div className="fade-in">
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Peso Atual (kg)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        name="peso_inicial" 
                        className="form-input" 
                        value={formData.peso_inicial} 
                        onChange={handleInputChange} 
                        step="0.1"
                      />
                      <span className="input-unit">kg</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Altura (cm)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        name="altura" 
                        className="form-input" 
                        value={formData.altura} 
                        onChange={handleInputChange} 
                      />
                      <span className="input-unit">cm</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">IMC (Automático)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={imc || '-'} 
                      readOnly 
                      style={{ backgroundColor: 'var(--gray-100)', fontWeight: '600' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Objetivo (Múltipla escolha)</label>
                  <div className="options-grid">
                    {objetivoOptions.map(opt => (
                      <button 
                        key={opt}
                        type="button" 
                        className={`option-btn ${formData.objetivos.includes(opt) ? 'active' : ''}`}
                        onClick={() => handleMultiSelect('objetivos', opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    name="objetivo_texto" 
                    className="form-input" 
                    style={{ marginTop: '0.5rem' }} 
                    placeholder="Outro objetivo ou observação..." 
                    value={formData.objetivo_texto} 
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nível de Atividade Física</label>
                  <div className="options-grid">
                    {atividadeOptions.map(opt => (
                      <button 
                        key={opt}
                        type="button" 
                        className={`option-btn ${formData.nivel_atividade === opt ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, nivel_atividade: opt }))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Patologias ou condições de saúde</label>
                  <div className="options-grid">
                    <button 
                      type="button" 
                      className={`option-btn ${formData.patologias.includes('Nenhum') ? 'active' : ''}`}
                      onClick={() => handleMultiSelect('patologias', 'Nenhum')}
                    >
                      Nenhum
                    </button>
                    {patologiaOptions.map(opt => (
                      <button 
                        key={opt}
                        type="button" 
                        className={`option-btn ${formData.patologias.includes(opt) ? 'active' : ''}`}
                        onClick={() => handleMultiSelect('patologias', opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    name="patologias_extra" 
                    className="form-input" 
                    style={{ marginTop: '0.5rem' }} 
                    placeholder="Outras condições..." 
                    value={formData.patologias_extra} 
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Restrições Alimentares</label>
                    <div className="options-grid">
                      <button 
                        type="button" 
                        className={`option-btn ${formData.restricoes_alimentares.includes('Nenhum') ? 'active' : ''}`}
                        onClick={() => handleMultiSelect('restricoes_alimentares', 'Nenhum')}
                      >
                        Nenhum
                      </button>
                      {restricaoOptions.map(opt => (
                        <button 
                          key={opt}
                          type="button" 
                          className={`option-btn ${formData.restricoes_alimentares.includes(opt) ? 'active' : ''}`}
                          onClick={() => handleMultiSelect('restricoes_alimentares', opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      name="restricoes_extra" 
                      className="form-input" 
                      style={{ marginTop: '0.5rem' }} 
                      placeholder="Outras restrições..." 
                      value={formData.restricoes_extra} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alergias Alimentares</label>
                    <div className="options-grid">
                      <button 
                        type="button" 
                        className={`option-btn ${formData.alergias.includes('Nenhum') ? 'active' : ''}`}
                        onClick={() => handleMultiSelect('alergias', 'Nenhum')}
                      >
                        Nenhum
                      </button>
                      {alergiaOptions.map(opt => (
                        <button 
                          key={opt}
                          type="button" 
                          className={`option-btn ${formData.alergias.includes(opt) ? 'active' : ''}`}
                          onClick={() => handleMultiSelect('alergias', opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      name="alergias_extra" 
                      className="form-input" 
                      style={{ marginTop: '0.5rem' }} 
                      placeholder="Outras alergias..." 
                      value={formData.alergias_extra} 
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Medicamentos Contínuos</label>
                    <textarea 
                      name="medicamentos" 
                      className="form-input" 
                      rows="3" 
                      value={formData.medicamentos} 
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Suplementos em Uso</label>
                    <textarea 
                      name="suplementos" 
                      className="form-input" 
                      rows="3" 
                      value={formData.suplementos} 
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                  <button type="button" className="btn" style={{ width: 'auto', backgroundColor: 'var(--gray-200)' }} onClick={() => setActiveTab('pessoal')}>
                    Anterior
                  </button>
                  <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setActiveTab('habitos')}>
                    Próximo: Hábitos
                  </button>
                </div>
              </div>
            )}

            {/* Aba 3: Hábitos */}
            {activeTab === 'habitos' && (
              <div className="fade-in">
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Refeições por dia</label>
                    <input 
                      type="number" 
                      name="refeicoes_por_dia" 
                      className="form-input" 
                      value={formData.refeicoes_por_dia} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário que acorda</label>
                    <input 
                      type="text" 
                      name="horario_acorda" 
                      className="form-input" 
                      placeholder="Ex: 6 ou 0630"
                      value={formData.horario_acorda} 
                      onChange={handleInputChange}
                      onBlur={handleTimeBlur}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário que dorme</label>
                    <input 
                      type="text" 
                      name="horario_dorme" 
                      className="form-input" 
                      placeholder="Ex: 23 ou 2230"
                      value={formData.horario_dorme} 
                      onChange={handleInputChange}
                      onBlur={handleTimeBlur}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Quantidade de água p/ dia</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        name="litros_agua" 
                        className="form-input" 
                        value={formData.litros_agua} 
                        onChange={handleInputChange} 
                        step="0.1"
                      />
                      <span className="input-unit">litros</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pratica atividade física?</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="atividade_fisica" 
                          checked={formData.atividade_fisica === true} 
                          onChange={() => setFormData(prev => ({ ...prev, atividade_fisica: true }))} 
                        /> Sim
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="atividade_fisica" 
                          checked={formData.atividade_fisica === false} 
                          onChange={() => setFormData(prev => ({ ...prev, atividade_fisica: false, atividade_fisica_descricao: '' }))} 
                        /> Não
                      </label>
                    </div>
                  </div>
                </div>

                {formData.atividade_fisica && (
                  <div className="form-group fade-in">
                    <label className="form-label">Qual atividade e frequência semanal?</label>
                    <input 
                      type="text" 
                      name="atividade_fisica_descricao" 
                      className="form-input" 
                      value={formData.atividade_fisica_descricao} 
                      onChange={handleInputChange} 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Observações Gerais</label>
                  <textarea 
                    name="observacoes" 
                    className="form-input" 
                    rows="4" 
                    value={formData.observacoes} 
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                  <button type="button" className="btn" style={{ width: 'auto', backgroundColor: 'var(--gray-200)' }} onClick={() => setActiveTab('clinico')}>
                    Anterior
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                    {loading ? 'Salvando...' : <><Save size={18} /> Salvar Paciente</>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .tab-btn {
          flex: 1;
          padding: 1.25rem;
          border: none;
          background: none;
          font-weight: 600;
          color: var(--gray-600);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }
        .tab-btn:hover {
          background-color: var(--gray-100);
          color: var(--primary);
        }
        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
          background-color: var(--primary-light);
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
        }
        .input-unit {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-600);
          font-size: 0.875rem;
          pointer-events: none;
        }
        .options-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .option-btn {
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          border: 1px solid var(--border-color);
          background-color: var(--white);
          color: var(--gray-600);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .option-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .option-btn.active {
          background-color: var(--primary);
          color: var(--white);
          border-color: var(--primary);
        }
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
          .tab-btn {
            padding: 1rem 0.5rem;
            font-size: 0.875rem;
          }
          .auth-card {
            border-radius: 1rem;
          }
        }
        @media (max-width: 480px) {
          .main-content {
            padding: 1rem;
            padding-top: 5.5rem;
          }
          .tab-btn span {
            display: none;
          }
          .option-btn {
            padding: 0.4rem 0.8rem;
            font-size: 0.75rem;
          }
        }
      `}} />
    </div>
  );
};

export default PatientForm;
