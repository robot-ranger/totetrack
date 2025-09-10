// Using named export to avoid deprecated default export 'QRCode'
import { useState, useRef, MouseEvent } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Box, Code, VStack, Button, Flex, Text } from '@chakra-ui/react'

export default function QRLabel({ uuid, name, compact = false }: { uuid: string; name?: string; compact?: boolean }) {
    const [open, setOpen] = useState(false)
    const qrWrapperRef = useRef<HTMLDivElement | null>(null)
    const last6 = uuid.replace(/-/g, '').slice(-6)
    const size = compact ? 64 : 180
    const url = `https://totetrack:5173/totes/${uuid}`

    function handleClick(e: MouseEvent) {
        // Prevent parent row navigation
        e.stopPropagation()
        e.preventDefault()
        setOpen(true)
    }

    function handleClose(e?: MouseEvent) {
        e?.stopPropagation()
        setOpen(false)
    }

    function handlePrint(e: MouseEvent) {
        e.stopPropagation()
        const canvas = qrWrapperRef.current?.querySelector('canvas') as HTMLCanvasElement | null
        if (!canvas) return
        const dataUrl = canvas.toDataURL('image/png')
        const win = window.open('', '_blank')
        if (win) {
            win.document.write(`<!DOCTYPE html><html><head><title>QR Label ${last6}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui,Arial,sans-serif;} img{width:320px;height:320px;} code{margin-top:12px;font-size:24px;} @media print { body { height:auto; } }</style></head><body><img src="${dataUrl}" alt="QR ${last6}"/><h1>${name}</h1><code>${last6}</code><script>window.onload=()=>setTimeout(()=>window.print(),100)</script></body></html>`)
            win.document.close()
        }
    }

    return (
        <>
            <Box
                as={VStack}
                gap={1}
                p={2}
                borderWidth="1px"
                borderStyle="dashed"
                borderRadius="md"
                display="inline-flex"
                role="button"
                tabIndex={0}
                onClick={handleClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleClick(e as any) } }}
                _hover={{ bg: 'bg.subtle', cursor: 'pointer' }}
            >
                <QRCodeCanvas value={url} size={size} includeMargin={false} />
                {name && <Text fontSize={compact ? 'xs' : 'sm'}>{name}</Text>}
                <Code fontSize={compact ? 'xs' : 'md'}>{last6}</Code>
            </Box>

            {open && (
                <Box
                    position="fixed"
                    inset={0}
                    bg="blackAlpha.700"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={2000}
                    onClick={handleClose}
                >
                    <Box
                        bg="bg.canvas"
                        borderWidth="1px"
                        borderRadius="md"
                        p={4}
                        minW={{ base: '90%', sm: 'auto' }}
                        boxShadow="lg"
                        onClick={e => e.stopPropagation()} // trap inside
                    >
                        <Flex justifyContent="space-between" alignItems="center" mb={3} gap={4}>
                            <Text fontWeight="bold">QR Label</Text>
                            <Flex gap={2}>
                                <Button size="sm" onClick={handlePrint} colorPalette="blue">Print</Button>
                                <Button size="sm" variant="ghost" onClick={handleClose}>Close</Button>
                            </Flex>
                        </Flex>
                        <VStack>
                            {/* Type cast to allow grabbing underlying canvas element */}
                            <Box ref={qrWrapperRef}>
                                <QRCodeCanvas value={url} size={320} includeMargin={false} />
                            </Box>
                            {name && <Text fontSize="3xl">{name}</Text>}
                            <Code fontSize="lg">{last6}</Code>
                        </VStack>
                    </Box>
                </Box>
            )}
        </>
    )
}