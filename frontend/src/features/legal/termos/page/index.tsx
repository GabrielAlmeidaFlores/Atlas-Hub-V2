import type { ReactNode } from "react";
import { LegalPage } from "@/features/legal/components/legal-page";

export default function TermosPage(): ReactNode {
  return (
    <LegalPage
      title="Termos de Uso"
      intro="Estes Termos regulam o acesso e o uso da plataforma Atlas Hub. Ao criar uma conta ou utilizar nossos serviços, você declara que leu e concorda com estas condições."
      sections={[
        {
          title: "Sobre a Atlas Hub",
          paragraphs: [
            "A Atlas Hub é uma plataforma de tecnologia e curadoria que conecta incorporadoras e investidores a oportunidades do mercado imobiliário. A Atlas Hub não é instituição financeira e não capta, custodia ou administra recursos de investidores por conta própria.",
            "A estruturação regulatória, o cadastro e a jornada de investimento podem ser operados por parceiros habilitados, incluindo a Divify, conforme o produto e a oferta apresentados.",
          ],
        },
        {
          title: "Cadastro e conta",
          paragraphs: [
            "Você deve fornecer informações verdadeiras, completas e atualizadas. É responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua conta.",
            "O cadastro é pessoal. O uso por terceiros, a criação de contas com dados falsos e a tentativa de burlar mecanismos de segurança são proibidos.",
          ],
        },
        {
          title: "Investimentos e riscos",
          paragraphs: [
            "Toda oportunidade envolve risco. Rentabilidade, prazos e liquidez não são garantidos. Antes de investir, leia os documentos da oferta, avalie sua situação financeira e procure orientação independente quando necessário.",
            "As condições de cada oferta, incluindo modelo de retorno, riscos, prazos e eventuais taxas, prevalecem sobre informações gerais apresentadas na plataforma.",
          ],
        },
        {
          title: "Condições para incorporadoras",
          paragraphs: [
            "A incorporadora é responsável pela veracidade, atualidade e integridade das informações e documentos enviados, inclusive dados do empreendimento, da SPE/SCP e da equipe.",
            "A aprovação na curadoria não representa garantia de captação, de retorno, de conclusão da obra ou de aprovação por parceiros regulados. A publicação e as condições da oferta dependem das etapas e dos contratos aplicáveis.",
            "A incorporadora deve manter as autorizações necessárias para uso de imagens, documentos e informações de terceiros, respondendo por eventuais violações.",
          ],
        },
        {
          title: "Condições para investidores",
          paragraphs: [
            "O investidor declara que avaliará cada oportunidade com base nos documentos da oferta, no seu perfil e na sua capacidade financeira. A Atlas Hub não garante rentabilidade, liquidez ou devolução do capital.",
            "A jornada de cadastro, KYC, pagamento, custódia, eventuais reembolsos e distribuições pode ser executada por parceiro regulado, conforme os termos da oferta e da plataforma parceira.",
            "O investidor deve manter seus dados atualizados e comunicar qualquer suspeita de fraude ou acesso não autorizado.",
          ],
        },
        {
          title: "Uso permitido",
          paragraphs: [
            "Você concorda em não utilizar a plataforma para fraudes, lavagem de dinheiro, manipulação de informações, assédio, violação de direitos de terceiros ou qualquer finalidade ilícita.",
            "A Atlas Hub pode suspender ou encerrar contas que violem estes Termos, a legislação aplicável ou as regras dos parceiros regulados.",
          ],
        },
        {
          title: "Conteúdo e propriedade intelectual",
          paragraphs: [
            "Textos, marcas, layouts, softwares e demais conteúdos da Atlas Hub pertencem à Atlas Hub ou a seus licenciantes. O uso da plataforma não transfere qualquer direito de propriedade intelectual.",
            "Materiais enviados por incorporadoras continuam de responsabilidade de quem os enviou, que declara ter autorização para compartilhá-los.",
          ],
        },
        {
          title: "Disponibilidade e limitação",
          paragraphs: [
            "Buscamos manter a plataforma disponível e segura, mas ela pode passar por manutenções, atualizações ou indisponibilidades temporárias.",
            "Na medida permitida pela lei, a Atlas Hub não responde por decisões de investimento tomadas pelo usuário, por informações prestadas por terceiros ou por eventos fora do seu controle.",
          ],
        },
        {
          title: "Privacidade e contato",
          paragraphs: [
            "O tratamento de dados pessoais é descrito na Política de Privacidade. Ao aceitar estes Termos, você também declara ciência dessa política.",
            "Para dúvidas, solicitações ou comunicações, entre em contato pelo e-mail contato@atlascomp.com.br.",
          ],
        },
      ]}
    />
  );
}
