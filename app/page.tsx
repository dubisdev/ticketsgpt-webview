"use client"
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react';
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [response, setResponse] = useState<undefined | string>()

  // get query params
  const params = useSearchParams()
  const apiKey = params.get("apiKey")
  const question = params.get("question")

  useEffect(() => {
    askGpt(question as string, apiKey as string).then((res) => {
      setResponse(res)
    })
  }, [])

  if (!question) return (<div>Pregunta a nuestra IA sobre tus entradas y los datos de tu festival 🎉</div>)

  if (!response) return <Loading />

  return <ReactMarkdown>{response}</ReactMarkdown>
}

const Loading = () => <div className="dot-pulse"></div>

const askGpt = async (prompt: string, apiKey: string) => {
  try {
    const response = await queryOpenAIServer(prompt, { model: "gpt-3.5-turbo", apiKey });

    if (!response.ok) return "No se pudo conectar con el servidor"

    const res = await response.json()
    return res?.choices?.[0]?.message?.content || "No se pudo obtener respuesta"

  } catch (e: any) {
    if (e?.name === 'AbortError') return;
    return "No se pudo conectar con el servidor"
  }
}

type OpenAISettings = {
  model: string;
  apiKey: string;
}

let abortController = new AbortController();

const queryOpenAIServer = async (prompt: string, { model, apiKey }: OpenAISettings) => {
  abortController.abort();
  abortController = new AbortController();

  return fetch('https://api.openai.com/v1/chat/completions', {
    signal: abortController.signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, stream: false, messages: [...INITIAL_GPT_MESSAGES, { role: 'user', content: prompt }] })
  })
}

const INITIAL_GPT_MESSAGES = [{
  role: "system",
  content: "Eres un asistnte virtual que ayuda a los usuarios a obtener información acerca de sus entradas. Este es un proyecto de prueba, por lo que responderás de manera aleatoria a las preguntas del usuario con la información que consideres adecuada a la pregunta. Si no sabes algo, debes inventarlo."
}, {
  role: "system",
  content: "Los mensajes deben estar correctamente formateados en markdown. Recuerda tu rol, respondes preguntas sobre entradas. Si el usuario te pregunta algo que no tiene que ver con entradas, debes responder 'No entiendo tu pregunta. Prueba con...' e introduces una pregunta que sí puedas responder."
}, {
  role: "system",
  content: "Además de las entradas, también puedes responder preguntas sobre el evento en general. Por ejemplo, si el usuario pregunta '¿Cuándo es el evento?', puedes responder 'El evento es el 1 de enero de 2022'."
}, {
  role: "system",
  content: "Utiliza respuestas rápidas y concisas. No hace falta que te extiendas demasiado. Si el usuario quiere más información, puede preguntar de nuevo."
}, {
  role: "system",
  content: "Solo podrás responder una vez, así que asegúrate de que tu respuesta sea la correcta."
}, {
  role: "system",
  content: "Recuerda que es un proyecto de prueba, puedes inventar la información que quieras siempre que sea coherente con la pregunta del usuario y esté relacionada con las entradas o el evento."
}] as const
