import * as React from 'react'

import createEmotionServer from '@emotion/server/create-instance'
import Document, { Html, Head, Main, NextScript } from 'next/document'

import createEmotionCache from '../../lib/createEmotionCache'
import theme from '../../styles/theme'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        </Head>
        <body>
          <Main />
          <NextScript />

          {/* Chatbot script that will run on the client */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Only run on client
                  if (typeof window === 'undefined') return;
                  
                  // ---- CONFIG ----
                  const RASA_URL = "http://3.149.71.6:5005";
                  const PDP_BASE = "https://ignitiv-nextjs-storefront-poc.vercel.app/product/";
                  const sessionId = "user_" + Math.floor(Math.random()*1e9);

                  // Create chat UI
                  const chatDiv = document.createElement('div');
                  chatDiv.innerHTML = \`
                    <div id="chat-container" style="
                      position: fixed;
                      right: 24px;
                      bottom: 24px;
                      width: 380px;
                      height: 540px;
                      background: #fff;
                      border-radius: 12px;
                      box-shadow: 0 8px 26px rgba(0,0,0,.12);
                      display: flex;
                      flex-direction: column;
                      overflow: hidden;
                      z-index: 1000;
                    ">
                      <div id="header" style="
                        background: #0b61ff;
                        color: #fff;
                        padding: 14px 16px;
                        font-weight: 700;
                        border-top-left-radius: 12px;
                        border-top-right-radius: 12px;
                      ">The Ignitiv Store</div>
                      <div id="body" style="
                        flex: 1;
                        padding: 12px;
                        overflow-y: auto;
                        background: #fafafa;
                      "></div>
                      <div id="input" style="
                        display: flex;
                        border-top: 1px solid #e5e5e5;
                      ">
                        <input id="txt" placeholder="Type your message..." style="
                          flex: 1;
                          padding: 12px;
                          border: 0;
                          font-size: 14px;
                        "/>
                        <button id="send-btn" style="
                          border: 0;
                          background: #0b61ff;
                          color: #fff;
                          padding: 0 14px;
                          cursor: pointer;
                        ">▶</button>
                      </div>
                    </div>
                  \`;
                  document.body.appendChild(chatDiv);

                  // Load Socket.IO dynamically
                  const script = document.createElement('script');
                  script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
                  script.onload = function() {
                    // Initialize after Socket.IO is loaded
                    initChatbot();
                  };
                  document.head.appendChild(script);

                  function initChatbot() {
                    // ---- SOCKET ----
                    const socket = window.io(RASA_URL, { transports: ["websocket"] });

                    // ---- DOM REFS ----
                    const body = document.getElementById("body");
                    const input = document.getElementById("txt");
                    const sendBtn = document.getElementById("send-btn");

                    // ---- RENDER HELPERS ----
                    function addTyping() { 
                      const t = document.createElement("div"); 
                      t.id = "typing"; 
                      t.className = "typing"; 
                      t.textContent = "Bot is typing..."; 
                      body.appendChild(t); 
                      body.scrollTop = body.scrollHeight; 
                    }
                    
                    function removeTyping() { 
                      const t = document.getElementById("typing"); 
                      if (t) t.remove(); 
                    }
                    
                    function addUser(text) {
                      const row = document.createElement("div"); 
                      row.className = "msg user";
                      const b = document.createElement("div"); 
                      b.className = "bubble"; 
                      b.textContent = text;
                      row.appendChild(b); 
                      body.appendChild(row); 
                      body.scrollTop = body.scrollHeight;
                    }

                    async function fetchProductDetails(productCode) {
                      const query = \`
                      query product($productCode: String!) {
                       product(productCode: $productCode) {
													productCode
													content {
														productName
														productShortDescription
														productImages {
															imageUrl
														}
													}
													options {
														attributeFQN
														attributeDetail {
															name
														}
														values {
															value
														}
													}
													price {
														price
														salePrice
													}
												}
                      }
                      \`;
                      const res = await fetch('/api/graphql', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ operationName: "product" ,query, variables: { productCode } }) });
                      const data = await res.json();
                      return data?.data?.product || null;
                    }

                    async function addBot(text, buttons) {
                      const row = document.createElement("div"); 
                      row.className = "msg bot";
                      const b = document.createElement("div"); 
                      b.className = "bubble";

                      if (text && text.startsWith("CARD::")) {
                        try {
                          const j = JSON.parse(text.replace("CARD::", ""));
                          let paddedCode;
													if (j.code_print.toString().length === 15) {
														paddedCode = "00" + j.code_print;
													} else {
														paddedCode = j.code_print.toString().padStart(13, "0");
													}

													const product = await fetchProductDetails(paddedCode);
                          console.log("CARD DATA:", product);
                          // Prefer URL from server; fallback to building from code_print/product_id
                          const code = j.code_print || j.product_id || "";
                          const builtUrl = code ? (PDP_BASE + encodeURIComponent(code)) : "";
                          const openUrl = j.product_url || builtUrl;
													let optionsHtml = "";

													if(!product){
														optionsHtml = \`
															<div style="color:red; font-weight:bold; margin:8px 0;">
																Out of stock
															</div>
														\`;
													} else {
														optionsHtml = (product.options || [])
															.map(opt => {
																const valuesHtml = opt.values
																.map(v => \`
																	<span class="opt" 
																	data-attr="\${opt.attributeFQN}" 
																	data-value="\${v.value}"
																	style="
																		display:inline-block;
																		margin:4px;
																		padding:6px 10px;
																		border:1px solid #333;
																		border-radius:4px;
																		cursor:pointer;
																	">
																	\${v.value}
																	</span>
																\`)
																.join("");

															return \`
															<div class="option-group" style="margin:6px 0;">
																<div><b>\${(opt.attributeDetail && opt.attributeDetail.name) || ""}</b></div>
																<div>\${valuesHtml}</div>
															</div>
															\`;
														})
														.join("");
													}


                          b.innerHTML = \`
                            <div class="card">
                              \${j.image ? \`<img src="\${j.image}" alt="Product" style="max-width: 100%; border-radius: 6px;">\` : ""}
                              <h4 style="margin: 6px 0;">\${j.name || ""}</h4>
                              <p style="margin: 4px 0;"><b>Price:</b> \${j.price || ""}</p>
                              \${j.description ? \`<p style="color: #555; margin: 4px 0;">\${j.description}</p>\` : ""}
                              <div class="options" style="margin:10px 0;">\${optionsHtml}</div>
                              <div class="btns" style="margin-top: 8px;">
                                <span class="btn" data-action="open" data-url="\${openUrl}" style="
                                  display: inline-block;
                                  margin: 0 6px 6px 0;
                                  padding: 6px 10px;
                                  border-radius: 6px;
                                  background: #e8f0ff;
                                  border: 1px solid #c7daff;
                                  cursor: pointer;
                                ">Add to cart</span>
                                <span class="btn" data-action="open" data-url="\${openUrl}" style="
                                  display: inline-block;
                                  margin: 0 6px 6px 0;
                                  padding: 6px 10px;
                                  border-radius: 6px;
                                  background: #e8f0ff;
                                  border: 1px solid #c7daff;
                                  cursor: pointer;
                                ">Buy Product</span>
                              </div>
                            </div>
                          \`;

							const selectedOptions = {};

							b.querySelectorAll(".opt").forEach(el => {
								el.addEventListener("click", () => {
									const attr = el.getAttribute("data-attr");
									const val = el.getAttribute("data-value");

									selectedOptions[attr] = val;

									el.parentNode.querySelectorAll(".opt").forEach(optEl => {
										optEl.style.background = "";
										optEl.style.color = "";
									});
									el.style.background = "#333";
									el.style.color = "#fff";
								});
							});

                          b.querySelectorAll(".btn").forEach(el => {
                            el.onclick = () => {
                              if (el.textContent === "Add to cart") {
                                window.dispatchEvent(
                                new CustomEvent("chatbot:addToCart", {
                                    detail: {
                                      productCode: product?.productCode || paddedCode,
                                      variationProductCode: null,
                                      options: Object.entries(selectedOptions).map(([attr, value]) => ({
																				attributeFQN: attr,
																				value
																			})),
                                      quantity: 1,
                                    },
                                  })
                                )
                              } else { 
                                const url = el.getAttribute("data-url");
                                if (url) window.open(url, "_blank");
                              }
                            };
                          });

                        } catch(e) {
                          b.textContent = text;
                        }
                      } else {
                        b.textContent = text || "";
                        if (buttons && buttons.length) {
                          const box = document.createElement("div"); 
                          box.className = "btns";
                          box.style.marginTop = "8px";
                          buttons.forEach(btn => {
                            const el = document.createElement("span"); 
                            el.className = "btn";
                            el.style = "display: inline-block; margin: 0 6px 6px 0; padding: 6px 10px; border-radius: 6px; background: #e8f0ff; border: 1px solid #c7daff; cursor: pointer;";
                            el.textContent = btn.title || btn.payload;
                            el.onclick = () => send(btn);
                            box.appendChild(el);
                          });
                          b.appendChild(box);
                        }
                      }

                      row.appendChild(b); 
                      body.appendChild(row); 
                      body.scrollTop = body.scrollHeight;
                    }

                    // ---- SEND ----
                    function send(msg) {
                      let shown, toSend;

                      if (msg && typeof msg === "object") {
                        shown = msg.title || msg.payload || "";
                        toSend = msg.payload || msg.title || "";
                      } else if (typeof msg === "string") {
                        shown = toSend = msg;
                      } else {
                        shown = toSend = input.value.trim();
                      }
                      if (!toSend) return;

                      addUser(shown);
                      addTyping();
                      socket.emit("user_uttered", { message: toSend, session_id: sessionId });
                      input.value = "";
                    }

                    // ---- SOCKET HANDLERS ----
                    socket.on("connect", () => {
                      socket.emit("session_request", { session_id: sessionId });

                      // Welcome with quick buttons
                      addBot("Welcome to the store!", [
                        { title: "Product Recommendation", payload: "/search_product" },
                        { title: "Track my order", payload: "/track_order" }
                      ]);

                      // Also trigger greet (optional)
                      socket.emit("user_uttered", { message: "/greet", session_id: sessionId });
                    });

                    socket.on("bot_uttered", (res) => {
                      removeTyping();
                      if (res?.text || res?.buttons) {
                        addBot(res.text || "", res.buttons || []);
                      }
                    });

                    // Event listeners
                    sendBtn.addEventListener('click', () => send());
                    input.addEventListener('keypress', (e) => {
                      if (e.key === 'Enter') send();
                    });
                  }
                })();
              `,
            }}
          />
        </body>
      </Html>
    )
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx) => {
  const view = ctx.renderPage

  // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache()
  const { extractCriticalToChunks } = createEmotionServer(cache)

  ctx.renderPage = () =>
    view({
      // eslint-disable-next-line react/display-name
      enhanceApp: (App: any) => (props) => <App emotionCache={cache} {...props} />,
    })

  const initialProps = await Document.getInitialProps(ctx)
  // This is important. It prevents emotion to render invalid HTML.
  // See https://github.com/mui-org/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html)
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ))

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [...React.Children.toArray(initialProps.styles), ...emotionStyleTags],
  }
}
