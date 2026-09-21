-- The terms of use and the privacy policy, as rows.
--
-- `legal_documents` was written in the initial schema and stayed empty, so the
-- screen rendered prose out of the locale files and `legal_acceptances` had no
-- document to point at — there was no record that anybody had agreed to
-- anything. Consent has to be consent to a *version*, which is what this table
-- is for.
--
-- The text is the same text the locale files already carried, turned into the
-- markdown `content_md` holds: `#` for the document's title, `##` per section.
-- It is placeholder copy written for the design, not reviewed by a lawyer —
-- replace both documents before anyone who is not you installs the app.

insert into public.legal_documents (kind, locale, version, effective_at, requires_reacceptance, content_md)
values
  ('terms', 'pt-BR', '1.0', timestamptz '2026-09-20 00:00:00+00', false,
   $md$# Termos de uso

## Quem pode usar o treff

É preciso ter pelo menos 18 anos e usar seu nome real. Uma pessoa, uma conta — perfis criados para se passar por outra pessoa são removidos.

## Sua conta

Você responde pelo que acontece na sua conta e por manter a senha só com você. Avise a gente assim que desconfiar que alguém entrou nela.

## Planos e encontros

Quem cria um plano escolhe o lugar, o horário e quem entra. Os encontros acontecem em lugares públicos e o treff não organiza nem acompanha nenhum deles.

## Como a gente se trata

Apareça quando confirmar presença, respeite quem está na mesa e nada de cantadas, assédio ou vender qualquer coisa. Quem passa disso perde o acesso.

## Assinatura

O plano pago é cobrado pela loja do seu celular e renova sozinho até você cancelar. O cancelamento vale a partir do próximo período.

## O que você publica

O texto e as fotos dos seus planos continuam seus. Você só nos dá permissão para mostrá-los no app a quem está por perto.

## Encerrar a conta

Dá para apagar sua conta quando quiser, nas configurações. A gente também pode suspender contas que quebram estas regras ou colocam alguém em risco.

## Mudanças nestes termos

Quando algo importante mudar, avisamos no app antes de valer. Continuar usando o treff depois disso significa que você aceitou a nova versão.
$md$),
  ('privacy', 'pt-BR', '1.0', timestamptz '2026-09-20 00:00:00+00', false,
   $md$# Política de privacidade

## O que a gente guarda

Seu nome, data de nascimento, idiomas, interesses e as fotos que você envia. Sem isso não dá para montar o perfil que aparece nos planos.

## Sua localização

Usamos sua posição só para ordenar os planos por distância. Ninguém vê seu endereço: as outras pessoas veem o bairro e um raio aproximado.

## A selfie de verificação

A selfie serve apenas para confirmar que você é uma pessoa real e conferir com sua foto de perfil. Ela não aparece para ninguém e é apagada depois da verificação.

## Com quem compartilhamos

Só com os serviços que fazem o app funcionar: hospedagem, envio de notificações, pagamentos e métricas de uso. Não vendemos seus dados nem exibimos anúncios.

## Por quanto tempo

Guardamos seus dados enquanto a conta existir. Depois que você apaga a conta, o perfil sai dos nossos sistemas em até 30 dias, salvo o que a lei manda manter.

## Seus direitos

Você pode ver, corrigir, exportar ou apagar seus dados quando quiser. É só pedir pelas configurações ou pelo e-mail abaixo.

## Notificações e métricas

As notificações avisam de pedidos e mensagens; as métricas são anônimas e mostram onde o app trava. Dá para desligar as notificações no aparelho a qualquer momento.

## Fale com a gente

Dúvidas sobre privacidade? Escreva para privacy@treff.app — respondemos em até 30 dias.
$md$),
  ('terms', 'en', '1.0', timestamptz '2026-09-20 00:00:00+00', false,
   $md$# Terms of use

## Who can use treff

You need to be at least 18 and to use your real name. One person, one account — profiles set up to pass as someone else are removed.

## Your account

You are responsible for what happens on your account and for keeping your password to yourself. Tell us as soon as you suspect someone else got in.

## Plans and meetups

Whoever creates a plan picks the place, the time and who joins. Meetups happen in public places, and treff neither organises nor supervises any of them.

## How we treat each other

Show up when you say you will, respect everyone at the table, and no flirting, harassment or selling anything. Cross that line and you lose access.

## Subscription

The paid plan is billed by your phone’s app store and renews on its own until you cancel. Cancelling takes effect from the next period.

## What you post

The text and photos in your plans stay yours. You only give us permission to show them in the app to people nearby.

## Closing your account

You can delete your account whenever you like, from settings. We can also suspend accounts that break these rules or put someone at risk.

## Changes to these terms

When something important changes, we tell you in the app before it takes effect. Carrying on with treff afterwards means you accept the new version.
$md$),
  ('privacy', 'en', '1.0', timestamptz '2026-09-20 00:00:00+00', false,
   $md$# Privacy Policy

## What we keep

Your name, date of birth, languages, interests and the photos you upload. Without those we cannot build the profile that shows up on plans.

## Your location

We use your position only to sort plans by distance. Nobody sees your address: other people see your neighbourhood and a rough radius.

## The verification selfie

The selfie only confirms that you are a real person and matches you against your profile photo. It is shown to nobody and deleted once verification is done.

## Who we share it with

Only the services that keep the app running: hosting, push notifications, payments and usage metrics. We do not sell your data and we run no ads.

## How long we keep it

We keep your data while the account exists. After you delete it, your profile leaves our systems within 30 days, except what the law requires us to hold.

## Your rights

You can see, correct, export or delete your data whenever you want. Just ask from settings or at the address below.

## Notifications and metrics

Notifications tell you about requests and messages; metrics are anonymous and show us where the app stalls. You can turn notifications off on your device at any time.

## Talk to us

Questions about privacy? Write to privacy@treff.app — we answer within 30 days.
$md$)
on conflict do nothing;
