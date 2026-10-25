# Busca, Descoberta e Minha Mesa — Guia de UX (Pastus)

## Objetivo

Permitir que o cliente do **Pastus Fogo & Parrilla** consulte rapidamente todos os pratos e cortes reais da casa, descubra acompanhamentos que harmonizam, simule a conta da mesa e acione reservas ou eventos pelo WhatsApp com poucos toques no celular.

## Fluxos principais

- **Busca livre sem acentos:** aceita nome do corte (`Ancho`, `Picanha`, `Fiorentina`, `Dry Aged`), ingrediente (`burrata`, `trufado`, `cogumelos`, `doce de leite`) ou código (`P01` a `P60`).
- **Curadoria e Harmonização:** ao abrir um corte da parrilla, o cliente escolhe o molho incluso (*Chimichurri*, *Cogumelos*, *Pimenta Verde* ou *Maionese Trufada*) e vê acompanhamentos recomendados.
- **Minha Mesa:** funciona offline no navegador (`localStorage`), soma os valores, permite simular os 10% opcionais e dividir entre amigos, além de gerar o texto formatado para reserva no WhatsApp (`+55 31 99628-0166`).
- **Acessibilidade e Tema:** suporte completo a navegação por teclado, `aria-live`, `prefers-reduced-motion` e alternância entre Modo Noturno (Brasa/Carvão `#141210`) e Modo Claro (Linho/Creme `#faf6ee`).
