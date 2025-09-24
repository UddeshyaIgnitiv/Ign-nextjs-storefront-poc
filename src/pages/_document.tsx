import * as React from 'react'

import Document, { Html, Head, Main, NextScript } from 'next/document'

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
                  const RASA_URL = "/api/rasa/rasa";
                  const PDP_BASE = "https://ignitiv-nextjs-storefront-poc.vercel.app/product/";
                  const sessionId = "user_" + Math.floor(Math.random() * 1e9);

									const iconBtn = document.createElement("div");
									iconBtn.className = "chatbot-button";
									iconBtn.innerHTML = \`<img src="/icons/chatbot-speech-bubble.svg" alt="Chatbot" class="chatbot-icon chatbot-icon--medium">\`;
									document.body.appendChild(iconBtn);

									const chatDiv = document.createElement("div");
									chatDiv.innerHTML = \`
										<div id="chat-container">
											<div id="header">
												The Ignitiv Store
												<span id="close-chat" style="float:right;cursor:pointer;">✖</span>
											</div>
                      <div id="body">
                      <div class="initial-card">
                        <div class="header">
                          <div class="title">E-commerce Bot</div>
                          <div class="subtitle">How can I help you today?</div>
                        </div>

                        <div class="welcome-btn product" data-action="product">
                          <div class="icon blue">📦</div>
                          <div>
                            <div class="btn-title">Product Recommendation</div>
                            <div class="btn-subtitle">Find the perfect products for you</div>
                          </div>
                        </div>

                        <div class="welcome-btn order" data-action="order">
                          <div class="icon green">🚚</div>
                          <div>
                            <div class="btn-title">Order Tracking</div>
                            <div class="btn-subtitle">Check the status of your order</div>
                          </div>
                        </div>
                      </div>
                    </div>
											<div id="input" style="display: flex; border-top: 1px solid #e5e5e5;">
												<input id="txt" placeholder="Type your message..." style="flex:1; padding:12px; border:0; font-size:14px;" />
												<button id="send-btn" style="border:0;background:#2ea195;color:#fff;padding:0 14px;cursor:pointer;">▶</button>
											</div>
										</div>
									\`;
									document.body.appendChild(chatDiv);

									const chatContainer = document.getElementById("chat-container");
									const closeBtn = document.getElementById("close-chat");

									// Toggle open/close
									iconBtn.onclick = () => {
										chatContainer.style.display = "flex";
										iconBtn.style.display = "none";
									};
									closeBtn.onclick = () => {
										chatContainer.style.display = "none";
										iconBtn.style.display = "flex";
									};

                  const body = document.getElementById("body");
                  const input = document.getElementById("txt");
                  const sendBtn = document.getElementById("send-btn");

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

									async function getCurrentUserId() {
										try {
											const res = await fetch("/api/rasa/user");
											const data = await res.json();
											return data.userId;
										} catch (e) {
											console.error("Failed to get user ID", e);
											return null;
										}
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
                            attributeDetail { name }
                            values { 
                              value
                              stringValue
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
                      body: JSON.stringify({ operationName: "product", query, variables: { productCode } })
                    });
                    const data = await res.json();
                    return data?.data?.product || null;
                  }

                  async function addBot(text, buttons) {
                    const row = document.createElement("div"); 
                    row.className = "msg bot";
                    const b = document.createElement("div"); 
                    b.className = "bubble";
                    const rowOrder = document.createElement("div");

										const orderRegex = /Thanks for the order number/;
										const orderMatch = text.match(/I’ve saved it\./);
                    if (orderMatch) {
                        const orderId = orderMatch?.input?.split("**")
                        const orderNumber = orderId[1] ? parseInt(orderId[1], 10) : null
                        rowOrder.className = "msg bot";
                        const c = document.createElement("div"); 
                        c.className = "bubble orderStatus";
                        c.innerHTML = 'Looking for order...';
                        getCurrentUserId().then(async userId => {
													if (userId) {
														try {
                              const res = await fetch("/api/rasa/order", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  orderNumber: orderNumber.toString()
                                }),
                              })

                              const data = await res.json()

                              if (data?.orders?.items?.length > 0) {
                                const order = data?.orders?.items[0]
                                c.innerHTML = \`Found it! Order # <b>\${order.orderNumber}</b><br>Status: <b>\${order.status}</b>\`;
                              } else {
                                c.innerHTML  = \`Sorry, I couldn’t find details for order <b>\${orderNumber}</b>.\`
                              }
                            } catch (err) {
                              console.error("Error fetching order:", err)
                              c.innerHTML = \`Something went wrong while fetching your order details.\`
                            }
													} else {
                            c.innerHTML = \`Please log in to track your orders.\`
													}
												});
                        rowOrder.appendChild(c); 
                    }  
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
                        const code = j.code_print || j.product_id || "";
                        const builtUrl = code ? (PDP_BASE + encodeURIComponent(code)) : "";
                        const openUrl = j.product_url || builtUrl;

                        let optionsHtml = "";
                        if (!product) {
                          optionsHtml = '<div style="color:red; font-weight:bold; margin:8px 0;">Out of stock</div>';
                        } else {
                          optionsHtml = (product.options || []).map(opt => {
                            const valuesHtml = opt.values.map(v => \`
                              <span class="opt" data-attr="\${opt.attributeFQN}" data-value="\${v.value}" style="
                                display:inline-block;
                                margin:4px;
                                padding:6px 10px;
                                border:1px solid #333;
                                border-radius:4px;
                                cursor:pointer;
                              ">\${v.stringValue}</span>
                            \`).join("");
                            return \`
                              <div class="option-group" style="margin:6px 0;">
                                <div><b>\${(opt.attributeDetail && opt.attributeDetail.name) || ""}</b></div>
                                <div>\${valuesHtml}</div>
                              </div>
                            \`;
                          }).join("");
                        }

                        b.innerHTML = \`
                          <div class="card">
                            \${j.image ? \`<img src="\${j.image}" alt="Product" style="max-width:100%;border-radius:6px;">\` : ""}
                            <h4 style="margin:6px 0;">\${j.name || ""}</h4>
                            <p style="margin:4px 0;"><b>Price:</b> \${j.price || ""}</p>
                            \${j.description ? \`<p style="color:#555;margin:4px 0;">\${j.description}</p>\` : ""}
                            <div class="options" style="margin:10px 0;">\${optionsHtml}</div>
														
                            \${product ? \`
															<div class="btns" style="margin-top:8px;">
																<span class="btn" data-action="open" data-url="\${openUrl}" >Add to cart</span>
																<a class="btn" href="/product/\${j.code_print}">Buy Product</a>
															</div>
														\` : ""}
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
                                    options: Object.entries(selectedOptions).map(([attr, value]) => ({ attributeFQN: attr, value })),
                                    quantity: 1,
                                  },
                                })
                              );
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
                          el.textContent = btn.title || btn.payload;
                          el.onclick = () => send(btn);
                          box.appendChild(el);
                        });
                        b.appendChild(box);
                      }
                    }

                    row.appendChild(b); 
                    body.appendChild(row);
                    body.appendChild(rowOrder);   
                    body.scrollTop = body.scrollHeight;
                  }

                  async function send(msg) {
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
                    input.value = "";

                    try {
                      const res = await fetch(RASA_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: toSend, session_id: sessionId }),
                      });
                      const data = await res.json();
                      removeTyping();
                      data.forEach(r => addBot(r.text || "", r.buttons || []));
                    } catch(e) {
                      removeTyping();
                      addBot("Sorry, something went wrong.");
                    }
                  } 

                  sendBtn.addEventListener('click', () => send());
                  input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') send();
                  });

                  document.querySelectorAll(".welcome-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                      const action = btn.getAttribute("data-action");
                      let message = "";
                      if (action === "product") {
                        message = "Product Recommendation"; 
                      } else if (action === "order") {
                        message = "Order Tracking"; 
                      }
                      if (message) {
                        send(message);
                      }
                    });
                  });

                })();
              `,
            }}
          />
        </body>
      </Html>
    )
  }
}
