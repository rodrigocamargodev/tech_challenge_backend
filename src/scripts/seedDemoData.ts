/**
 * Conteúdo fictício do seed de demonstração do Blog de Giz.
 *
 * Os títulos são usados como identificadores estáveis para a idempotência:
 * o seed localiza uma postagem de demonstração pelo título exato. Por isso,
 * NÃO altere os títulos sem revisar a lógica de reutilização em `seedDemo.ts`.
 *
 * Limites do modelo `Post` respeitados aqui:
 * - titulo: obrigatório, até 200 caracteres.
 * - conteudo: obrigatório, até 20000 caracteres.
 */
export interface PostDemo {
  titulo: string;
  conteudo: string;
}

export const POSTS_DEMO: readonly PostDemo[] = [
  {
    titulo: 'A importância da tecnologia na educação',
    conteudo: [
      'A tecnologia deixou de ser um recurso opcional nas escolas e passou a ocupar o centro do processo de ensino-aprendizagem. Ferramentas digitais ampliam o acesso ao conhecimento, permitem aulas mais dinâmicas e aproximam o conteúdo da realidade dos estudantes.',
      'Quando bem utilizada, a tecnologia não substitui o professor: ela potencializa o trabalho docente. Plataformas colaborativas, simuladores e ambientes virtuais de aprendizagem tornam possível personalizar o ritmo de cada aluno e oferecer feedback mais rápido.',
      'O grande desafio é garantir formação continuada para os educadores e infraestrutura adequada. Sem esses dois pilares, a tecnologia corre o risco de virar apenas um enfeite caro, em vez de uma ferramenta transformadora.',
      'Neste post, discutimos como começar de forma simples: escolhendo uma ferramenta por vez, definindo um objetivo pedagógico claro e medindo o impacto real na aprendizagem dos alunos.',
    ].join('\n\n'),
  },
  {
    titulo: 'Como organizar uma rotina de estudos',
    conteudo: [
      'Estudar sem método costuma gerar cansaço e resultados abaixo do esperado. Uma boa rotina de estudos começa pela definição de metas realistas e pela divisão do conteúdo em blocos menores e gerenciáveis.',
      'A técnica Pomodoro, por exemplo, alterna períodos de foco com pausas curtas e ajuda a manter a concentração. Já a revisão espaçada distribui o contato com o conteúdo ao longo da semana, o que melhora a retenção na memória de longo prazo.',
      'Também é fundamental reservar um ambiente fixo e livre de distrações, além de registrar o que foi estudado. Esse registro funciona como um diário de aprendizagem e mostra, com clareza, o progresso ao longo do tempo.',
      'Por fim, lembre-se de incluir descanso na rotina. O cérebro consolida o aprendizado durante o sono e as pausas, não apenas durante o esforço.',
    ].join('\n\n'),
  },
  {
    titulo: 'O papel da leitura no desenvolvimento dos alunos',
    conteudo: [
      'A leitura é uma das habilidades mais determinantes para o sucesso escolar. Ela amplia o vocabulário, melhora a escrita e desenvolve a capacidade de interpretar o mundo de forma crítica.',
      'Alunos que leem com regularidade tendem a ter mais facilidade em todas as disciplinas, porque a leitura é a base para compreender enunciados, argumentar e resolver problemas. O hábito, porém, não nasce sozinho: ele precisa ser cultivado.',
      'Estratégias simples funcionam bem: rodas de leitura, indicações compartilhadas entre colegas e momentos diários de leitura livre, sem cobrança de avaliação. O prazer de ler vem antes da obrigação de ler.',
      'Neste texto, reunimos sugestões práticas para professores e famílias que desejam formar leitores autônomos e curiosos.',
    ].join('\n\n'),
  },
  {
    titulo: 'Inteligência artificial como ferramenta de aprendizagem',
    conteudo: [
      'A inteligência artificial já faz parte do cotidiano dos estudantes, seja em assistentes virtuais, seja em recomendações de conteúdo. Na educação, ela pode ser uma aliada poderosa quando usada com propósito pedagógico.',
      'Entre os usos mais promissores estão a geração de exercícios personalizados, o apoio à correção de textos e a criação de ambientes de estudo adaptativos. Esses recursos liberam o professor para tarefas mais estratégicas e humanas.',
      'Ao mesmo tempo, é essencial discutir ética, privacidade e uso responsável. Ensinar o aluno a questionar as respostas da IA e a verificar fontes é tão importante quanto ensinar a usá-la.',
      'O equilíbrio está em tratar a IA como ferramenta, e não como substituta do pensamento crítico. A tecnologia ajuda; a reflexão continua sendo humana.',
    ].join('\n\n'),
  },
  {
    titulo: 'Sustentabilidade no ambiente escolar',
    conteudo: [
      'Educar para a sustentabilidade vai além de ensinar conceitos de ecologia. Trata-se de formar cidadãos capazes de tomar decisões conscientes sobre o consumo, o descarte e o uso dos recursos naturais.',
      'A escola é um espaço privilegiado para essa formação. Projetos de horta comunitária, coleta seletiva, economia de água e energia transformam o discurso em prática diária e envolvem toda a comunidade escolar.',
      'Quando os alunos participam ativamente dessas iniciativas, o aprendizado se torna significativo e duradouro. Eles passam a enxergar a sustentabilidade como responsabilidade coletiva, e não como tema distante.',
      'Neste post, apresentamos ideias de projetos que podem ser adaptados a diferentes realidades e faixas etárias, sempre com foco em resultados concretos e participação dos estudantes.',
    ].join('\n\n'),
  },
];
